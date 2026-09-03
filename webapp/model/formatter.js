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
            if (!aChargList || bHasStock !== true) return false;
            // const aValid = aChargList.filter(function (item) { return item.Charg && item.Charg !== ""; });
            // return aValid.length >= 1; // solo múltiples
            return aChargList.length >= 1;
        },

        hasAvailableStockAndSingle: function (aChargList, bHasStock) {
            if (!aChargList || bHasStock !== true) return false;
            // const aValid = aChargList.filter(function (item) { return item.Charg && item.Charg !== ""; });
            return aChargList.length === 1; // solo único
        },

        getChargText: function (aChargListFiltered) {
            if (!aChargListFiltered || aChargListFiltered.length === 0) return "";
            const aValid = aChargListFiltered.filter(function (item) { return item.Charg && item.Charg !== ""; });
            return aValid.length === 1 ? aValid[0].Charg : "";
        }
    }
});