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
        }
    }
});