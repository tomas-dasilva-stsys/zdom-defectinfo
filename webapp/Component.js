/**
 * eslint-disable @sap/ui5-jsdocs/no-jsdoc
 */

sap.ui.define([
        "sap/ui/core/UIComponent",
        "sap/ui/Device",
        "zdom/zdom/model/models",
        "zdom/zdom/utils/FioriComponent"
    ],
    function (UIComponent, Device, models, FioriComponent) {
        "use strict";

        return UIComponent.extend("zdom.zdom.Component", {
            metadata: {
                manifest: "json"
            },
            
            init: function () {
                // call the base component's init function
                UIComponent.prototype.init.apply(this, arguments);

                // enable routing
                this.getRouter().initialize();

                FioriComponent.setComponent(this);

                // set the device model
                this.setModel(models.createDeviceModel(), "device");
            }
        });
    }
);