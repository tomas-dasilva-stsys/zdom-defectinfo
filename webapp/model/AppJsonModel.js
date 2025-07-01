sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "zdom/zdom/utils/FioriComponent"
], function (JSONModel, FioriComponent) {
    "use strict";

    return {
        getModel: function () {
            //gets component
            var component = FioriComponent.getComponent();
            //gets model
            var jsonModel = component.byId("App").getModel("AppJsonModel");
            //checks if the model exists
            if (!jsonModel) {
                jsonModel = new JSONModel();
                component.byId("App").setModel(jsonModel, "AppJsonModel");
            }
            return jsonModel;
        },

        initializeModel: function () {
            var jsonModel = this.getModel();
            jsonModel.setData({
                "DefectInfo": {
                    "Plant": "",
                    "ProductionOrder": "",
                    "ElementCode": "",
                    "WorkCenter": "",
                    "Material": "",
                    "DefectCode": "",
                    "ProductOrderOperation": "",
                    "SerialNumber": "",
                    "CauseCode": "",
                    "CauseCodeGruppe": "",
                    "Equipment": "",
                    "RepairCode": "",
                    "UnitOfMeasure": "",
                    "Quantity": "1",
                },
                "Plant": [{
                    "label": "{i18n>plant}",
                    "template": "Plant"
                }, {
                    "label": "{i18n>name}",
                    "template": "Name"
                }
                ],
                "WorkCenter": [{
                    "label": "{i18n>workcenter}",
                    "template": "WorkCenter"
                },
                {
                    "label": "{i18n>plant}",
                    "template": "Plant"
                }
                ],
                "ProductionOrder": [{
                    "label": "{i18n>productionOrder}",
                    "template": "ProductionOrder"
                },
                {
                    "label": "{i18n>plant}",
                    "template": "Plant"
                },
                {
                    "label": "{i18n>material}",
                    "template": "Material"
                },
                {
                    "label": "{i18n>materialDescription}",
                    "template": "MaterialDescription"
                },
                {
                    "label": "{i18n>uom}",
                    "template": "UnitOfMeasure"
                },
                {
                    "label": "{i18n>orderType}",
                    "template": "OrderType"
                },
                {
                    "label": "{i18n>releaseDate}",
                    "template": "ReleaseDate"
                },
                ],
                "ProductOrderOperation": [
                    {
                        "label": "{i18n>productionOrderOp}",
                        "template": "ProductOrderOperation"
                    },
                    {
                        "label": "{i18n>plant}",
                        "template": "Plant"
                    },
                    {
                        "label": "{i18n>workcenter}",
                        "template": "WorkCenter"
                    },
                    {
                        "label": "{i18n>numberSequence}",
                        "template": "NumSeq"
                    },
                ],
                "Material": [
                    {
                        "label": "{i18n>material}",
                        "template": "Material"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                    {
                        "label": "{i18n>uom}",
                        "template": "UnitOfMeasure"
                    },
                ],
                "SerialNumber": [{
                    "label": "{i18n>serialNumber}",
                    "template": "SerialNumber"
                }, {
                    "label": "{i18n>productionOrder}",
                    "template": "ProductionOrder"
                }],
                "ElementCode": [
                    {
                        "label": "{i18n>elementCode}",
                        "template": "ElementCode"
                    },
                    {
                        "label": "{i18n>plant}",
                        "template": "Plant"
                    },
                    {
                        "label": "{i18n>workcenter}",
                        "template": "WorkCenter"
                    },
                    {
                        "label": "{i18n>productionOrderOp}",
                        "template": "ProductOrderOperation"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                ],
                "DefectCode": [
                    {
                        "label": "{i18n>defectCode}",
                        "template": "DefectCode"
                    },
                    {
                        "label": "{i18n>plant}",
                        "template": "Plant"
                    },
                    {
                        "label": "{i18n>workcenter}",
                        "template": "WorkCenter"
                    },
                    {
                        "label": "{i18n>productionOrderOp}",
                        "template": "ProductOrderOperation"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                ],
                "CauseCodeGruppe": [
                    {
                        "label": "{i18n>causeCodeGruppe}",
                        "template": "CauseCodeGruppe"
                    },
                    {
                        "label": "{i18n>plant}",
                        "template": "Plant"
                    },
                    {
                        "label": "{i18n>workcenter}",
                        "template": "WorkCenter"
                    },
                    {
                        "label": "{i18n>productionOrderOp}",
                        "template": "ProductOrderOperation"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                ],
                "CauseCode": [
                    {
                        "label": "{i18n>causeCode}",
                        "template": "CauseCode"
                    },
                    {
                        "label": "{i18n>plant}",
                        "template": "Plant"
                    },
                    {
                        "label": "{i18n>workcenter}",
                        "template": "WorkCenter"
                    },
                    {
                        "label": "{i18n>productionOrderOp}",
                        "template": "ProductOrderOperation"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                ],
                "RepairCode": [{
                    "label": "{i18n>repairCode}",
                    "template": "RepairCode"
                },
                {
                    "label": "{i18n>description}",
                    "template": "Description"
                }
                ],
                "Equipment": [
                    {
                        "label": "{i18n>equipment}",
                        "template": "Equipment"
                    },
                    {
                        "label": "{i18n>description}",
                        "template": "Description"
                    },
                    {
                        "label": "{i18n>sortField}",
                        "template": "SortField"
                    },
                ],
                "WorkCenters": [],
                "Equipments": [],
                "TableData": [{}],
                "Descripcion": {},
                "Enabled": {
                    "Material": true,
                    "WorkCenter": true,
                    "Equipment": false,
                    "SaveBtn": false,
                    "Select": true,
                    "guardar": ""
                },
                "Editable": {
                    "ShowValueHelp": true,
                    "ValueHelpSerialNumber": true,
                    "WorkCenter": true,
                    "Select": true,
                },
            });
            return jsonModel;
        },

        setProperty: function (sPropery, value) {
            this.getModel().setProperty(sPropery, value);
            this.updateModel();
        },

        setInnerProperty: function (sProperty, innerProp, value) {
            let mainProp = this.getProperty(sProperty);

            mainProp[innerProp] = value;
            this.updateModel();
        },

        getProperty: function (sPropery) {
            return this.getModel().getProperty(sPropery);
        },

        updateModel: function () {
            this.getModel().updateBindings(true);
        }

    };
});