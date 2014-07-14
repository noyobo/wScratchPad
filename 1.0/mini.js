/**
 * @fileoverview 
 * @author 宝码<nongyoubao@alibaba-inc.com>
 * @module wScratchPad
 **/
KISSY.add(function (S, Node, Lang) {
    var $ = Node.all,
        EventTarget = S.Event.Target;
    /**
     *
     * @class WScratchPad
     * @constructor
     */
    function WScratchPad(config) {

    }

    S.augment(WScratchPad, EventTarget, /** @lends WScratchPad.prototype*/{

    });

    return WScratchPad;

}, {requires:['node', 'lang']});



