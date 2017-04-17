import * as _ from 'lodash';
import { Vm } from '../vm';
import { Table } from './table';

export let Number = (vm: Vm) => ({
  'times': (args, acc, closure, level) => {
    let list = _.times(args[0].value, i => vm.runTable(args[1], acc, closure, level, [i]));
    let map = _.reduce(list, (acc, value, i) => _.assign(acc, {[i] : value}), {});
    return _.merge({type: 'table', args: [], block: []}, Table(vm), map);
  },
  '<' : (args) => args[0].value < args[1].value,
  '>' : (args) => args[0].value > args[1].value,
  '<=' : (args) => args[0].value <= args[1].value,
  '>=' : (args) => args[0].value >= args[1].value,
  '+' : (args) => args[0].value + args[1].value,
  '-' : (args) => args[0].value - args[1].value,
  '*' : (args) => args[0].value * args[1].value,
  '/' : (args) => args[0].value / args[1].value,
  '^' : (args) => Math.pow(args[0].value, args[1].value),
  'squared' : (args) => args[0].value * args[0].value,
  'sqrt': (args) => Math.sqrt(args[0].value),
  'log': (args) => Math.log(args[0].value),
  'log10': (args) => Math.log10(args[0].value),
  'log2': (args) => Math.log2(args[0].value),
  'exp': (args) => Math.exp(args[0].value)
});