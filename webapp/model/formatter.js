sap.ui.define([], function () {
    "use strict";

    return {
        formatDate: function (sValue) {
            if (!sValue) return "";
            let oDate = new Date(sValue);
            return oDate;
        }
    }
});