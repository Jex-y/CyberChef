/**
 * @author Edward Jex [edward.j.jex@durham.ac.uk]
 * @copyright Crown Copyright 2024
 * @license Apache-2.0
 */

import Operation from "../Operation.mjs";
import OperationError from "../errors/OperationError.mjs";
import xpath from "fontoxpath";
import xmldom from "@xmldom/xmldom";
const { evaluateXPathToNodes, evaluateXPath } = xpath;
/**
 * XQuery Evaluation operation
 */
class XQueryEvaluation extends Operation {

    /**
     * XQueryEvaluation constructor
     */
    constructor() {
        super();

        this.name = "XQuery Evaluation";
        this.module = "XQuery";
        this.description = "Evaluates an XQuery expression on XML data.";
        this.infoURL = "https://en.wikipedia.org/wiki/XQuery"; // Usually a Wikipedia link. Remember to remove localisation (i.e. https://wikipedia.org/etc rather than https://en.wikipedia.org/etc)
        this.inputType = "string";
        this.outputType = "string";
        this.args = [
            {
                name: "XQuery Expression",
                type: "text",
                value: ""
            },
        ];
    }

    /**
     * @param {string} input
     * @param {Object[]} args
     * @returns {string}
     */
    run(input, args) {
        const [xqueryExpression] = args;
        let root;
        try {
            root = new xmldom.DOMParser().parseFromString(input, "application/xml");
        } catch (e) {
            throw new OperationError(`Invalid XML`);
        }

        try {
            const result = evaluateXPathToNodes(xqueryExpression, root, null, null, { language: evaluateXPath.XQUERY_3_1_LANGUAGE });
            return result.toString();
        } catch (e) {
            throw new OperationError(`Invalid XQuery expression:\n${e.message}`);
        }

    }

}

export default XQueryEvaluation;
