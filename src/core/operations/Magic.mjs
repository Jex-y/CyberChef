/**
 * @author n1474335 [n1474335@gmail.com]
 * @copyright Crown Copyright 2016
 * @license Apache-2.0
 */

import Operation from "../Operation";
import Utils from "../Utils";
import Dish from "../Dish";
import MagicLib from "../lib/Magic";

/**
 * Magic operation
 */
class Magic extends Operation {

    /**
     * Magic constructor
     */
    constructor() {
        super();

        this.name = "Magic";
        this.flowControl = true;
        this.module = "Default";
        this.description = "The Magic operation attempts to detect various properties of the input data and suggests which operations could help to make more sense of it.<br><br><b>Options</b><br><u>Depth:</u> If an operation appears to match the data, it will be run and the result will be analysed further. This argument controls the maximum number of levels of recursion.<br><br><u>Intensive mode:</u> When this is turned on, various operations like XOR, bit rotates, and character encodings are brute-forced to attempt to detect valid data underneath. To improve performance, only the first 100 bytes of the data is brute-forced.<br><br><u>Extensive language support:</u> At each stage, the relative byte frequencies of the data will be compared to average frequencies for a number of languages. The default set consists of ~40 of the most commonly used languages on the Internet. The extensive list consists of 284 languages and can result in many languages matching the data if their byte frequencies are similar.";
        this.inputType = "ArrayBuffer";
        this.outputType = "html";
        this.args = [
            {
                "name": "Depth",
                "type": "number",
                "value": 3
            },
            {
                "name": "Intensive mode",
                "type": "boolean",
                "value": false
            },
            {
                "name": "Extensive language support",
                "type": "boolean",
                "value": false
            }
        ];
    }

    /**
     * @param {Object} state - The current state of the recipe.
     * @param {number} state.progress - The current position in the recipe.
     * @param {Dish} state.dish - The Dish being operated on.
     * @param {Operation[]} state.opList - The list of operations in the recipe.
     * @returns {Object} The updated state of the recipe.
     */
    async run(state) {
        const ings = state.opList[state.progress].ingValues,
            [depth, intensive, extLang] = ings,
            dish = state.dish,
            currentRecipeConfig = state.opList.map(op => op.config),
            magic = new MagicLib(await dish.get(Dish.ARRAY_BUFFER)),
            options = await magic.speculativeExecution(depth, extLang, intensive);

        let output = `<table
                class='table table-hover table-condensed table-bordered'
                style='table-layout: fixed;'>
            <tr>
                <th>Recipe (click to load)</th>
                <th>Result snippet</th>
                <th>Properties</th>
            </tr>`;

        /**
         * Returns a CSS colour value based on an integer input.
         *
         * @param {number} val
         * @returns {string}
         */
        function chooseColour(val) {
            if (val < 3) return "green";
            if (val < 5) return "goldenrod";
            return "red";
        }

        options.forEach(option => {
            // Construct recipe URL
            // Replace this Magic op with the generated recipe
            const recipeConfig = currentRecipeConfig.slice(0, state.progress)
                    .concat(option.recipe)
                    .concat(currentRecipeConfig.slice(state.progress + 1)),
                recipeURL = "recipe=" + Utils.encodeURIFragment(Utils.generatePrettyRecipe(recipeConfig));

            let language = "",
                fileType = "",
                matchingOps = "",
                useful = "";
            const entropy = `<span data-toggle="tooltip" data-container="body" title="Shannon Entropy is measured from 0 to 8. High entropy suggests encrypted or compressed data. Normal text is usually around 3.5 to 5.">Entropy: <span style="color: ${chooseColour(option.entropy)}">${option.entropy.toFixed(2)}</span></span>`,
                validUTF8 = option.isUTF8 ? "<span data-toggle='tooltip' data-container='body' title='The data could be a valid UTF8 string based on its encoding.'>Valid UTF8</span>\n" : "";

            if (option.languageScores[0].probability > 0) {
                let likelyLangs = option.languageScores.filter(l => l.probability > 0);
                if (likelyLangs.length < 1) likelyLangs = [option.languageScores[0]];
                language = "<span data-toggle='tooltip' data-container='body' title='Based on a statistical comparison of the frequency of bytes in various languages. Ordered by likelihood.'>" +
                    "Possible languages:\n    " +
                    likelyLangs.map(lang => {
                        return MagicLib.codeToLanguage(lang.lang);
                    }).join("\n    ") +
                    "</span>\n";
            }

            if (option.fileType) {
                fileType = `<span data-toggle="tooltip" data-container="body" title="Based on the presence of magic bytes.">File type: ${option.fileType.mime} (${option.fileType.ext})</span>\n`;
            }

            if (option.matchingOps.length) {
                matchingOps = `Matching ops: ${[...new Set(option.matchingOps.map(op => op.op))].join(", ")}\n`;
            }

            if (option.useful) {
                useful = "<span data-toggle='tooltip' data-container='body' title='This could be an operation that displays data in a useful way, such as rendering an image.'>Useful op detected</span>\n";
            }

            output += `<tr>
                <td><a href="#${recipeURL}">${Utils.generatePrettyRecipe(option.recipe, true)}</a></td>
                <td>${Utils.escapeHtml(Utils.printable(Utils.truncate(option.data, 99)))}</td>
                <td>${language}${fileType}${matchingOps}${useful}${validUTF8}${entropy}</td>
            </tr>`;
        });

        output += "</table><script type='application/javascript'>$('[data-toggle=\"tooltip\"]').tooltip()</script>";

        if (!options.length) {
            output = "Nothing of interest could be detected about the input data.\nHave you tried modifying the operation arguments?";
        }
        dish.set(output, Dish.HTML);
        return state;
    }

}

export default Magic;