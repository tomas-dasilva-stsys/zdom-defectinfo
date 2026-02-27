sap.ui.define([], function () {
    "use strict";

    return {
        formatDate: function (sValue) {
            if (!sValue) return "";
            let oDate = new Date(sValue);
            return oDate;
        },

        formatChargListVisibility: function (aChargList) {
            if (!aChargList || !Array.isArray(aChargList)) {
                return false;
            }
            return aChargList.some(function (item) {
                return item.Charg && item.Charg !== '';
            });
        },

        hasAvailableStockAndMultiple: function (aChargList, bHasStock) {
            return aChargList && aChargList.length >= 1 && bHasStock === true;
        },

        hasAvailableStockAndSingle: function (aChargList, bHasStock) {
            return aChargList && aChargList.length === 1 && bHasStock === true;
        }
    }
});