import assert from 'node:assert/strict';
import { illustrativeOrder, illustrativeContextOrders, orderStages, getIllustrativeStageCount } from './marketing-content';
const amounts = illustrativeOrder.amounts;
assert.equal(amounts.base + amounts.potatoes + amounts.bacon, 15450);
assert.equal(Object.values(amounts).reduce((sum, n) => sum + n, 0), 17950);
assert.equal(illustrativeOrder.productSubtotal, '$15.450');
assert.equal(illustrativeOrder.total, '$17.950');
assert.equal(new Set([illustrativeOrder.reference, ...illustrativeContextOrders.map(o => o.reference)]).size, 4);
assert.ok(illustrativeOrder.message.includes('#' + illustrativeOrder.reference));
for (const stage of orderStages) {
    assert.equal(orderStages.reduce((sum, s) => sum + getIllustrativeStageCount(s.key, stage.key), 0), 4);
    for (const s of orderStages) {
        assert.equal(getIllustrativeStageCount(s.key, stage.key), illustrativeContextOrders.filter(o => o.stage === s.key).length + Number(s.key === stage.key));
    }
}
console.log('PASS: fictional totals, references and four-stage contextual counts');
