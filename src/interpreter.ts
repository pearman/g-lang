import * as _ from 'lodash';

import { Table } from './types/table';
import { Number } from './types/number';
import { String } from './types/string';
import { Boolean } from './types/boolean';
let grammar = require('./grammar/grammar.js');

export class Interpreter {
    parseTree = {};
    lastExecutionTime = -1;

    eval(prog, persistentTree = {}) {
        let parseTree = {};
        let output = null;
        let executionTime = null;
        try {
            this.parseTree = this.toTable(grammar.parse(prog));
            let before = _.now();
            output = this.evalParseTree(this.parseTree, _.merge({}, persistentTree, this.parseTree));
            this.lastExecutionTime = _.now() - before;
        } catch (err) {
            throw err;
        }
        return output;
    }

    evalParseTree(parseTreeIn, parent = null, noTableExecution = false) {
        let parseTree = this.wrapPrimitive(parseTreeIn);
        
        // Handle Primitives
        if (!_.isObject(parseTreeIn)) return parseTree;

        // Handle Properties
        if (_.has(parseTree, '_property'))
            return this.evalParseTree(_.get(parent, parseTree._property), parent, true);

        // Handle Methods
        if (_.has(parseTree, '_method') && _.has(parseTree, '_args')) {
            let table: any = _.get(parent, parseTree._method);
            let args = _.map(parseTree._args, arg => this.evalParseTree(arg, parent, true));
            // Is it a JS function
            if (parent && _.isFunction(table)) {
                args.unshift(parent);
                return this.wrapPrimitive(table(args, parent));
            }
            if (_.isNil(table)) throw `Method '${parseTree._method}' undefined.`;
            // Otherwise it's a pear-script table
            let resolvedArgs = _.reduce(table._args, (acc, value:any, i) => {
                return _.merge(acc, {[value._property]: args[i]});
            }, {});
            return this.evalParseTree(_.merge(table, resolvedArgs), _.merge({}, parent, table));
        }

        // Handle Method Chains
        if (_.isArray(parseTree)) {
            return _.reduce(parseTree, (acc, element) => {
                if (!_.isObject(acc)) acc = this.wrapPrimitive(acc);
                return this.evalParseTree(element, _.merge({}, parent, acc));
            }, parent);
        }

        // Execute Table
        if (noTableExecution) return parseTree;
        let result = parseTree;
        let maxKey = -1;
        while (_.has(parseTree, ++maxKey))
            result = this.evalParseTree(parseTree[maxKey], parent);
        return result;
    }

    wrapPrimitive(statement) {
        if (_.isNumber(statement)) 
            return _.merge({}, Table(this), Number(this), {value: statement});
        if (_.isBoolean(statement)) 
            return _.merge({}, Table(this), Boolean(this), {value: statement});
        if (_.isString(statement)) 
            return _.merge({}, Table(this), String(this), {value: statement});
        if (_.has(statement, '_args') && !_.has(statement, '_method')) // is Table
            return _.merge({}, Table(this), statement);
        return statement;
    }

    toTable(parseTree) {
        let i = 0;
        return _.reduce(parseTree, (acc, value: any) => {
            // Is Primitive
            if (!_.isObject(value) && !_.isArray(value))
                return _.assign(acc, { [i++]: value });
            // Is Comment
            if (_.has(value, '_comment'))
                return acc;
            // Is Chain, Method, or Property
            if (_.isArray(value) || _.has(value, '_method') || _.has(value, '_property'))
                return _.assign(acc, { [i++]: value });
            // Is Assignment
            _.forEach(value, (value, key) => {
                _.set(acc, key, value);
            });
            return acc;
        }, {})
    }
}