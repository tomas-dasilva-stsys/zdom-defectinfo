sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/model/odata/v2/ODataModel",
    "sap/m/MessagePopover",
    "sap/m/MessagePopoverItem",
    "sap/m/MessageBox",
    "zdom/zdom/services/Service",
    "zdom/zdom/services/MatchcodesService",
    "zdom/zdom/model/AppJsonModel"
],
    function (Controller, JSONModel, Fragment, Filter, FilterOperator, ODataModel, MessagePopover, MessagePopoverItem, MessageBox, Service, MatchcodesService, AppJsonModel) {
        "use strict";
        let inputId;
        let materialFilters = [];
        let batchFilters = [];
        let boomForSave = [];
        let savedValues;

        let oMessageTemplate = new MessagePopoverItem({
            type: '{T}',
            title: '{S}',
        });

        let oMessagePopover = new MessagePopover({
            items: {
                path: '/',
                template: oMessageTemplate
            }
        });

        return Controller.extend("zdom.zdom.controller.DefectInfo", {
            oFragments: {},

            onInit: function () {
                AppJsonModel.initializeModel();
                let sLocale = sap.ui.getCore().getConfiguration().getLanguage();
                let i18nModel = new sap.ui.model.resource.ResourceModel({
                    bundleName: "zdom.zdom.i18n.i18n",
                    bundleLocale: sLocale
                });

                this.getView().setModel(i18nModel, "i18n");

                let pop_msgModel = new sap.ui.model.json.JSONModel({
                    "messageLength": '',
                    "type": 'Default'
                })

                this.getView().setModel(pop_msgModel, "popoverModel");
                let popModel = new sap.ui.model.json.JSONModel({});
                oMessagePopover.setModel(popModel);

                this.toggleSaveButton();

                let defaultValues = {
                    Zuser: '',
                    Zdate: new Date(),
                    DefaultTab: []
                }

                Service.callPostService('/ZDefaultValuesSet', defaultValues).then(data => {
                    let dataValues = data.DefaultTab.results;
                    let plantSaved;
                    let workcenterSaved;

                    if (dataValues.length > 0) {
                        plantSaved = dataValues.filter(val => val.Field === 'Plant')[0].Value;
                        workcenterSaved = dataValues.filter(val => val.Field === 'WorkCenter')[0].Value;
                    }

                    MatchcodesService.callGetService('/UserData', []).then(data => {
                        if (data.results.length === 0) return;

                        const plantInput = this.byId('Plant');
                        const declarationLineUser = data.results.filter(item => item.atnam === 'ZPP_DECLARATION_LINE');

                        // Checking for single line user.
                        if (declarationLineUser.length === 1) {
                            const declarationLineUser = data.results[0];
                            const { Plant, WorkCenter } = declarationLineUser;

                            AppJsonModel.setInnerProperty('/DefectInfo', 'Plant', Plant);
                            workcenterSaved === WorkCenter
                                ? AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', workcenterSaved)
                                : AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', WorkCenter);
                            AppJsonModel.setInnerProperty('/Editable', 'ShowValueHelp', false);
                            AppJsonModel.setInnerProperty('/Editable', 'WorkCenter', false);

                            plantInput.setShowValueHelp(false);
                            plantInput.setEditable(false);

                            // this.checkEquipment();
                            return;
                        }

                        if (declarationLineUser.length === 0) {
                            const declarationLineUser = data.results[0];
                            const { Plant, WorkCenter } = declarationLineUser;

                            AppJsonModel.setInnerProperty('/DefectInfo', 'Plant', Plant);
                            workcenterSaved === WorkCenter
                                ? AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', workcenterSaved)
                                : AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', WorkCenter);
                            AppJsonModel.setInnerProperty('/Editable', 'ShowValueHelp', false);
                            AppJsonModel.setInnerProperty('/Editable', 'WorkCenter', false);

                            plantInput.setShowValueHelp(false);
                            plantInput.setEditable(false);

                            // this.checkEquipment();
                            return;
                        }

                        // Setting multi-line User.
                        const { Plant } = declarationLineUser[0];

                        AppJsonModel.setInnerProperty('/DefectInfo', 'Plant', Plant);
                        plantInput.setShowValueHelp(false);
                        plantInput.setEditable(false);

                        const workCenters = AppJsonModel.getProperty('/WorkCenters');

                        if (declarationLineUser.length === 1) {
                            const { WorkCenter } = declarationLineUser[0];
                            AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', WorkCenter);
                            AppJsonModel.setInnerProperty('/Editable', 'ShowValueHelp', false);
                            return;
                        }

                        declarationLineUser.forEach(line => {
                            workCenters.push({
                                "WorkCenter": `${line.atwrt}`,
                                "Plant": `${Plant}`
                            });

                            if (workcenterSaved === line.atwrt) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', workcenterSaved);
                            }
                        })

                        // let filteredWorkCenters = [];
                        // for (let i = 0; i < workCenters.length; i++) {
                        //     if (JSON.stringify(workCenters[i]) === JSON.stringify(filteredWorkCenters[filteredWorkCenters.length - 1])) continue;

                        //     filteredWorkCenters.push(workCenters[i]);
                        // }

                        // if (filteredWorkCenters.length === 1) {
                        //     AppJsonModel.setProperty('/WorkCenter', filteredWorkCenters[0].WorkCenter);
                        //     AppJsonModel.setInnerProperty('/Editable', 'ShowValueHelp', false);
                        //     AppJsonModel.setInnerProperty('/Editable', 'WorkCenter', false);
                        //     this.checkEquipment();
                        //     return;
                        // }

                        AppJsonModel.setProperty('/WorkCenters', workCenters);
                        // this.checkEquipment();
                    }).catch(err => {
                        console.log(err);
                    })

                }).catch((oError) => {
                    console.log(oError);
                })
            },

            onExit: function () {
                this.destroyFragments();
            },

            onSelectChange: function (oEvent) {
                const currentWorkcenter = oEvent.getSource().getSelectedKey();
                AppJsonModel.setInnerProperty('/DefectInfo', 'WorkCenter', currentWorkcenter);
            },

            onLiveChange: function (oEvent) {
                let currInputId = oEvent.getSource().getId().split('-').pop();
                let currInput = this.byId(currInputId);
                currInput.setValue(oEvent.getParameter("value").toUpperCase());
                currInput.setValueState('None');
            },

            destroyFragments: function () {
                if (this.oFragments) {
                    Object.keys(this.oFragments).forEach(function (sKey) {
                        this.oFragments[sKey].destroy();
                        delete this.oFragments[sKey];
                    }, this);
                }
            },

            getCurrentSpath: function (oValue) {
                let paths = {
                    'ProductOrderOperation': { path: '/MatchCodeProductOrderOperation' },
                    'Material': { path: '/MatchCodeMaterial' },
                    'ElementCode': { path: '/MatchCodeElementCode' },
                    'DefectCode': { path: '/MatchCodeDefectCode' },
                    'CauseCodeGruppe': { path: '/MatchCodeCauseCodeGruppe' },
                    'CauseCode': { path: '/MatchCodeCauseCode' },
                    'WorkCenter': { path: '/MatchCodeWorkCenter' },
                    'Plant': { path: '/MatchCodeWerks' },
                    'ProductionOrder': { path: '/MatchCodeProductionOrder' },
                    'SerialNumber': { path: '/MatchCodeSerialNumber' },
                    'RepairCode': { path: '/MatchCodRepairCode' },
                    'Equipment': { path: '/MatchCodeEquipment' },
                }

                if (!oValue) {
                    return { path: '/', title: '', description: '' };
                }

                return paths[oValue];
            },

            getCurrentFilter: function (filterKey) {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let aFilter = [];
                let oFilters = []

                switch (filterKey) {
                    case 'WorkCenter':
                        const workCenters = AppJsonModel.getProperty('/WorkCenters');
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));

                        workCenters.forEach(workCenter => {
                            aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, workCenter.Name));
                        })
                        return aFilter;

                    case 'Equipment':
                        aFilter.push(new Filter('Plant', FilterOperator.EQ, defectInfo.Plant));
                        // aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        return aFilter;

                    case 'ProductionOrder':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        if (defectInfo.Material) {
                            aFilter.push(new Filter("Material", FilterOperator.EQ, defectInfo.Material));
                        }
                        return aFilter;

                    case 'ProductOrderOperation':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        return aFilter;

                    case 'SerialNumber':
                        aFilter.push(new Filter("ProductionOrder", FilterOperator.EQ, defectInfo.ProductionOrder));
                        return aFilter;
                }
            },

            getFilterForSubmit: function (filterKey) {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let aFilter = [];
                let oFilters = [];

                switch (filterKey) {
                    case 'Plant':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        return aFilter;

                    case 'ProductionOrder':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductionOrder", FilterOperator.EQ, defectInfo.ProductionOrder));
                        if (defectInfo.Material) {
                            aFilter.push(new Filter("Material", FilterOperator.EQ, defectInfo.Material));
                        }
                        return aFilter;

                    case 'ProductOrderOperation':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductOrderOperation", FilterOperator.EQ, defectInfo.ProductOrderOperation));
                        return aFilter;

                    case 'WorkCenter':
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        return aFilter;

                    case 'Material':
                        aFilter.push(new Filter("Material", FilterOperator.EQ, defectInfo.Material));
                        return aFilter;

                    case 'SerialNumber':
                        aFilter.push(new Filter("SerialNumber", FilterOperator.EQ, defectInfo.SerialNumber));
                        aFilter.push(new Filter("ProductionOrder", FilterOperator.EQ, defectInfo.ProductionOrder));
                        return aFilter;

                    case 'RepairCode':
                        aFilter.push(new Filter("RepairCode", FilterOperator.EQ, defectInfo.RepairCode));
                        return aFilter;

                    case 'ElementCode':
                        aFilter.push(new Filter("ElementCode", FilterOperator.EQ, defectInfo.ElementCode));
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductOrderOperation", FilterOperator.EQ, defectInfo.ProductOrderOperation));
                        return aFilter;

                    case 'DefectCode':
                        aFilter.push(new Filter("DefectCode", FilterOperator.EQ, defectInfo.DefectCode));
                        aFilter.push(new Filter("ElementCode", FilterOperator.EQ, defectInfo.ElementCode));
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductOrderOperation", FilterOperator.EQ, defectInfo.ProductOrderOperation));
                        return aFilter;

                    case 'CauseCodeGruppe':
                        aFilter.push(new Filter("CauseCodeGruppe", FilterOperator.EQ, defectInfo.CauseCodeGruppe));
                        aFilter.push(new Filter("DefectCode", FilterOperator.EQ, defectInfo.DefectCode));
                        aFilter.push(new Filter("ElementCode", FilterOperator.EQ, defectInfo.ElementCode));
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductOrderOperation", FilterOperator.EQ, defectInfo.ProductOrderOperation));
                        return aFilter;

                    case 'CauseCode':
                        aFilter.push(new Filter("CauseCode", FilterOperator.EQ, defectInfo.CauseCode));
                        aFilter.push(new Filter("DefectCode", FilterOperator.EQ, defectInfo.DefectCode));
                        aFilter.push(new Filter("ElementCode", FilterOperator.EQ, defectInfo.ElementCode));
                        aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("ProductOrderOperation", FilterOperator.EQ, defectInfo.ProductOrderOperation));
                        return aFilter;

                    case 'Equipment':
                        // aFilter.push(new Filter("Plant", FilterOperator.EQ, defectInfo.Plant));
                        // aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        aFilter.push(new Filter("Equipment", FilterOperator.EQ, defectInfo.Equipment));
                        return aFilter;
                }
            },

            setCodesFilters: function (inputId) {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');

                let plantValue = defectInfo.Plant;
                let workCtrValue = defectInfo.WorkCenter;
                let prodOrderPlanValue = defectInfo.ProductOrderOperation;
                let DCodeValue = defectInfo.DefectCode;
                let DlCodeValue = defectInfo.ElementCode;
                let CauseCodeGruppe = defectInfo.CauseCodeGruppe;

                let oFilters = [];
                let aFilter = [];

                switch (inputId) {
                    case 'DefectCode':
                        oFilters.push(new Filter('Plant', FilterOperator.EQ, plantValue));
                        oFilters.push(new Filter('WorkCenter', FilterOperator.EQ, workCtrValue));
                        oFilters.push(new Filter('ProductOrderOperation', FilterOperator.EQ, prodOrderPlanValue));
                        oFilters.push(new Filter('ElementCode', FilterOperator.EQ, DlCodeValue));
                        aFilter.push(oFilters);
                        return (aFilter);
                    case 'CauseCode':
                        oFilters.push(new Filter('Plant', FilterOperator.EQ, plantValue));
                        oFilters.push(new Filter('WorkCenter', FilterOperator.EQ, workCtrValue));
                        oFilters.push(new Filter('ProductOrderOperation', FilterOperator.EQ, prodOrderPlanValue));
                        oFilters.push(new Filter('DefectCode', FilterOperator.EQ, DCodeValue));
                        oFilters.push(new Filter('ElementCode', FilterOperator.EQ, DlCodeValue));
                        oFilters.push(new Filter('CauseCodeGruppe', FilterOperator.EQ, CauseCodeGruppe));
                        aFilter.push(oFilters);
                        return (aFilter);
                    case 'CauseCodeGruppe':
                        oFilters.push(new Filter('Plant', FilterOperator.EQ, plantValue));
                        oFilters.push(new Filter('WorkCenter', FilterOperator.EQ, workCtrValue));
                        oFilters.push(new Filter('ProductOrderOperation', FilterOperator.EQ, prodOrderPlanValue));
                        oFilters.push(new Filter('DefectCode', FilterOperator.EQ, DCodeValue));
                        oFilters.push(new Filter('ElementCode', FilterOperator.EQ, DlCodeValue));
                        aFilter.push(oFilters);
                        return (aFilter);
                    default:
                        oFilters.push(new Filter('Plant', FilterOperator.EQ, plantValue));
                        oFilters.push(new Filter('WorkCenter', FilterOperator.EQ, workCtrValue));
                        oFilters.push(new Filter('ProductOrderOperation', FilterOperator.EQ, prodOrderPlanValue));
                        aFilter.push(oFilters);
                        return aFilter;
                }

            },

            clearNotifications: function () {
                oMessagePopover.getModel().setData([]);
                oMessagePopover.getModel().refresh(true);
                this.getView().getModel('popoverModel').getData().messageLength = ''
                this.getView().getModel('popoverModel').getData().type = "Default";
                this.getView().getModel('popoverModel').refresh(true);
            },

            clearData: function () {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const noDataText = oResourceBundle.getText("noData");
                const bomModel = this.getOwnerComponent().getModel('boomData');
                const bomTable = this.byId("bomTable");

                AppJsonModel.setInnerProperty('/DefectInfo', 'ProductionOrder', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'Material', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'ProductOrderOperation', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'SerialNumber', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'UnitOfMeasure', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'RepairCode', '');
                AppJsonModel.setInnerProperty('/DefectInfo', 'Equipment', '');
                AppJsonModel.setInnerProperty('/Enabled', 'Material', true);

                bomModel.setData({});
                bomTable.setNoDataText(noDataText);

                return;
            },

            saveDefaultValue: function () {
                let oModel = this.getOwnerComponent().getModel();
                let defectInfoData = AppJsonModel.getProperty('/DefectInfo');
                let workCenterValue = defectInfoData.WorkCenter;
                let plantValue = defectInfoData.Plant;

                let valuesToSave = [
                    {
                        Field: 'WorkCenter',
                        Value: workCenterValue
                    },
                    {
                        Field: 'Plant',
                        Value: plantValue
                    }
                ]

                let defaultValues = {
                    Zuser: '',
                    Zdate: new Date(),
                    DefaultTab: valuesToSave
                }

                oModel.create('/ZDefaultValuesSet', defaultValues, {
                    headers: 'application/json',
                    success: function (data) {
                        return;
                    },
                    error: function (error) {
                        console.log(error);
                    }
                })
            },

            onValueHelpRequest: function (oEvent) {
                let defectInfoData = AppJsonModel.getProperty('/DefectInfo');
                let currentInputName = oEvent.getSource().getName();
                let currentInputId = oEvent.getSource().getId().split('--').at(-1);
                let oFilters;

                inputId = currentInputId;

                let currentData = this.getCurrentSpath(currentInputName);


                if (!defectInfoData.ProductionOrder && !defectInfoData.Plant) {
                    oFilters = [];
                }

                if (inputId === 'CauseCodeGruppe' || inputId === 'CauseCode' || inputId === 'DefectCode' || inputId === 'ElementCode') {
                    oFilters = this.setCodesFilters(inputId);
                } else {
                    oFilters = this.getCurrentFilter(inputId);
                }

                this.getFragment(`${inputId}HelpDialog`).then(oFragment => {
                    oFragment.getTableAsync().then(function (oTable) {
                        oTable.setModel(MatchcodesService.getOdataModel());
                        let tableCols = AppJsonModel.getProperty(`/${inputId}`);
                        let currentJsonModel = new JSONModel({
                            "cols": tableCols
                        })

                        oTable.setModel(currentJsonModel, "columns");

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: `${currentData.path}`,
                                filters: oFilters,
                                showHeader: false
                            });
                        }

                        oFragment.update();

                    });
                    oFragment.open();
                })
            },

            onValueHelpRequestWorkCenter: function (oEvent) {
                let currentInputId = oEvent.getSource().getId().split('--').at(-1);
                let workCenters = AppJsonModel.getProperty('/WorkCenters');

                let filteredWorkCenters = [];
                for (let i = 0; i < workCenters.length; i++) {
                    if (JSON.stringify(workCenters[i]) === JSON.stringify(filteredWorkCenters[filteredWorkCenters.length - 1])) continue;

                    filteredWorkCenters.push(workCenters[i]);
                }

                inputId = currentInputId;

                this.getFragment(`WorkCenterHelpDialog`).then(oFragment => {
                    oFragment.getTableAsync().then(function (oTable) {
                        let tableCols = AppJsonModel.getProperty("/WorkCenter");
                        let currentJsonModel = new JSONModel({
                            "cols": tableCols
                        })

                        oTable.setModel(currentJsonModel, "columns");

                        let workCenterModel = new JSONModel({
                            items: filteredWorkCenters
                        })

                        oTable.setModel(workCenterModel);

                        if (oTable.bindRows) {
                            oTable.bindAggregation("rows", {
                                path: "/items",
                                showHeader: false
                            });
                        }

                        oFragment.update();

                    });
                    oFragment.open();
                })
            },

            onValueHelpDialogEquipment: function (oEvent) {
                let currentInputId = oEvent.getSource().getId().split('--').at(-1);

                let currentData = AppJsonModel.getProperty('/DefectInfo');
                let equipments = AppJsonModel.getProperty('/Equipments');

                inputId = currentInputId;

                // LOGIC TO FILTER EQUIPMENT BY WORKCENTER
                // if (equipments.length > 0) {
                //     this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                //         oFragment.getTableAsync().then(function (oTable) {
                //             let tableCols = AppJsonModel.getProperty("/Equipment");
                //             let currentJsonModel = new JSONModel({
                //                 "cols": tableCols
                //             })

                //             oTable.setModel(currentJsonModel, "columns");

                //             let equipmentsModel = new JSONModel({
                //                 items: equipments
                //             })

                //             oTable.setModel(equipmentsModel);

                //             if (oTable.bindRows) {
                //                 oTable.bindAggregation("rows", {
                //                     path: "/items",
                //                     showHeader: false
                //                 });
                //             }

                //             oFragment.update();

                //         });
                //         oFragment.open();
                //     })
                // }

                // if (equipments.length === 0) {
                //     let equipmentPath = this.getCurrentSpath(inputId);
                //     let oFilters = this.getCurrentFilter('Equipment');

                //     MatchcodesService.callGetService(`${equipmentPath.path}`, [oFilters]).then(data => {
                //         const response = data.results;

                //         if (response.length === 0) {
                //             this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                //                 oFragment.getTableAsync().then(function (oTable) {
                //                     oTable.setModel(MatchcodesService.getOdataModel());
                //                     let tableCols = AppJsonModel.getProperty("/Equipment");
                //                     let currentJsonModel = new JSONModel({
                //                         "cols": tableCols
                //                     })

                //                     oTable.setModel(currentJsonModel, "columns");

                //                     if (oTable.bindRows) {
                //                         oTable.bindAggregation("rows", {
                //                             path: `${equipmentPath.path}`,
                //                             showHeader: false
                //                         });
                //                     }
                //                     oFragment.update();
                //                 });
                //                 oFragment.open();
                //             })
                //         } else if (response.length > 0) {
                //             this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                //                 oFragment.getTableAsync().then(function (oTable) {
                //                     oTable.setModel(MatchcodesService.getOdataModel());
                //                     let tableCols = AppJsonModel.getProperty("/Equipment");
                //                     let currentJsonModel = new JSONModel({
                //                         "cols": tableCols
                //                     })

                //                     oTable.setModel(currentJsonModel, "columns");

                //                     if (oTable.bindRows) {
                //                         oTable.bindAggregation("rows", {
                //                             path: `${equipmentPath.path}`,
                //                             filters: oFilters,
                //                             showHeader: false
                //                         });
                //                     }

                //                     oFragment.update();

                //                 });
                //                 oFragment.open();
                //             })
                //         }
                //     })
                // }

                let equipmentPath = this.getCurrentSpath(inputId);
                let oFilters = this.getCurrentFilter('Equipment');
                MatchcodesService.callGetService(`${equipmentPath.path}`, oFilters).then(data => {
                    const response = data.results;

                    if (response.length === 0) {
                        this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                            oFragment.getTableAsync().then(function (oTable) {
                                oTable.setModel(MatchcodesService.getOdataModel());
                                let tableCols = AppJsonModel.getProperty("/Equipment");
                                let currentJsonModel = new JSONModel({
                                    "cols": tableCols
                                })

                                oTable.setModel(currentJsonModel, "columns");

                                if (oTable.bindRows) {
                                    oTable.bindAggregation("rows", {
                                        path: `${equipmentPath.path}`,
                                        showHeader: false
                                    });
                                }
                                oFragment.update();
                            });
                            oFragment.open();
                        })
                    } else if (response.length > 0) {
                        this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                            oFragment.getTableAsync().then(function (oTable) {
                                oTable.setModel(MatchcodesService.getOdataModel());
                                let tableCols = AppJsonModel.getProperty("/Equipment");
                                let currentJsonModel = new JSONModel({
                                    "cols": tableCols
                                })

                                oTable.setModel(currentJsonModel, "columns");

                                if (oTable.bindRows) {
                                    oTable.bindAggregation("rows", {
                                        path: `${equipmentPath.path}`,
                                        filters: oFilters,
                                        showHeader: false
                                    });
                                }
                                oFragment.update();
                            });
                            oFragment.open();
                        })
                    }
                })
            },

            onExitDialog: function () {
                this.getFragment(`${inputId}HelpDialog`).then(function (oFragment) {
                    oFragment.close();
                });

                this.destroyFragments();
                this.onValueHelpClose();
            },

            onValueHelpOkPress: function (oEvent) {
                if (inputId === "ProductionOrder") {
                    let currProdOrder = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue()[inputId];
                    let currMatr = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().Material;
                    let cuurUoM = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().UnitOfMeasure;
                    let needSerialNumber = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().NeedSerialNumber;

                    if (!needSerialNumber) {
                        AppJsonModel.setInnerProperty('/Editable', "ValueHelpSerialNumber", false);
                    }

                    if (currMatr) {
                        AppJsonModel.setInnerProperty('/DefectInfo', "Material", currMatr);
                        AppJsonModel.setInnerProperty('/DefectInfo', "UnitOfMeasure", cuurUoM);
                        AppJsonModel.setInnerProperty('/Enabled', "Material", false);
                    }

                    AppJsonModel.setInnerProperty('/DefectInfo', inputId, currProdOrder);
                    this.byId(inputId).setValueState("None");
                    this.clearNotifications();
                    this.onExitDialog();
                    return;
                }

                if (inputId === 'WorkCenter') {
                    let currWorkcenter = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().WorkCenter;
                    AppJsonModel.setInnerProperty('/DefectInfo', "WorkCenter", currWorkcenter);
                    AppJsonModel.setInnerProperty('/DefectInfo', "ProductionOrder", '');
                    AppJsonModel.setInnerProperty('/DefectInfo', "Material", '');
                    AppJsonModel.setInnerProperty('/Enabled', "Material", true);
                    this.byId(inputId).setValueState("None");
                    this.onExitDialog();

                    // FUNCTION TO AUTOCOMPLETE EQUIPMENT
                    // this.checkEquipment();

                    return;
                }

                if (inputId === "Material") {
                    let currMatr = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().Material;
                    let cuurUoM = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue().UnitOfMeasure;

                    AppJsonModel.setInnerProperty('/DefectInfo', "Material", currMatr);
                    AppJsonModel.setInnerProperty('/DefectInfo', "UnitOfMeasure", cuurUoM);
                    this.byId(inputId).setValueState("None");
                    this.onExitDialog();
                    return;
                }

                if (inputId === "ProductOrderOperation") {
                    let currProdOrderProduction = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue()[inputId];
                    AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', inputId, currProdOrderProduction);
                    this.byId(inputId).setValueState('None');
                    this.onExitDialog();
                    return;
                }

                let currValue = oEvent.getParameter("tokens")[0].getCustomData()[0].getValue()[inputId];
                AppJsonModel.setInnerProperty('/DefectInfo', inputId, currValue);
                this.byId(inputId).setValueState("None");
                this.clearNotifications();

                this.onExitDialog();
            },

            onFilterBarSearch: function (oEvent) {
                let aSelectionSet = oEvent.getParameter("selectionSet");
                let releaseDate = new Date(aSelectionSet[1]?.getValue());
                let releaseDateTo = new Date(aSelectionSet[2]?.getValue());

                if (!releaseDateTo.getDate()) {
                    releaseDateTo = releaseDate;
                }

                let aFilters = this.setProdOrderFilters(aSelectionSet, releaseDate, releaseDateTo);

                this.getFragment(`${inputId}HelpDialog`).then(oFragment => {
                    let oBindingInfo = oFragment.getTable().getBinding("rows");

                    if (inputId === 'ElementCode' || inputId === 'DefectCode' || inputId === 'CauseCodeGruppe' || inputId === 'CauseCode') {
                        if (!aFilters.length) return

                        let prevFilters = oBindingInfo.aApplicationFilters;
                        oBindingInfo.aApplicationFilters = [];


                        let oFilters = new Filter({ filters: [...prevFilters[0], ...aFilters], and: true }); // false

                        oBindingInfo.filter(oFilters);
                        oFragment.update();
                        oBindingInfo.aApplicationFilters = prevFilters;
                        return;
                    }

                    if (aFilters.length) {
                        let oFilters = new Filter({
                            filters: aFilters,
                            and: true // false
                        });

                        oBindingInfo.filter(oFilters);
                        oFragment.update();
                        return;
                    }
                })
            },

            setProdOrderFilters: function (fields, releaseDate, releaseDateTo) {
                let filters = fields.reduce((aResult, oControl) => {
                    if (oControl.getName() === 'ReleaseDate' && oControl.getValue()) {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.BT, releaseDate, releaseDateTo));
                        return aResult;
                    }

                    if ((!oControl.getValue().startsWith("*") && !oControl.getValue().endsWith("*")) && (oControl.getName() !== "ReleaseDate" && oControl.getName() !== "ReleaseDateTo") && oControl.getValue().trim() !== '') {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.Contains, oControl.getValue()));
                        return aResult;
                    }

                    if (oControl.getValue().startsWith("*") && oControl.getValue().endsWith("*")) {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.Contains, oControl.getValue().slice(1, - 1)));
                        return aResult;
                    }

                    if (oControl.getValue().startsWith("*")) {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.EndsWith, oControl.getValue().slice(1)));
                        return aResult;
                    }

                    if (oControl.getValue().endsWith("*")) {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.StartsWith, oControl.getValue().slice(0, -1)));
                        return aResult;
                    }

                    return aResult;
                }, []);

                return filters;
            },

            onValueHelpClose: function (oEvent) {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');

                if (inputId === 'productionOrder') {
                    prodOrderPlan.setValue('');
                }

                if (inputId === 'WorkCenter' || inputId === 'Plant') {
                    this.saveDefaultValue();
                }

                if ((inputId === 'ProductionOrder' || inputId === 'ProductOrderOperation') && defectInfo.ProductionOrder && defectInfo.ProductOrderOperation) {
                    this.getBoomMaterials();
                }

                this.toggleSaveButton();
            },

            submitValue: function (oEvent) {
                let currValue = oEvent.getParameter("value");
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let currId = oEvent.getParameter("id").split('--').pop();
                let sPath = this.getCurrentSpath(currId).path;
                let aFilters = this.getFilterForSubmit(currId);
                let currWorkCenters = AppJsonModel.getProperty('/WorkCenters');
                let currEquipments = AppJsonModel.getProperty('/Equipments');

                // check if value exists. If don't return.
                if (!currValue && currId === 'ProductOrderOperation') {
                    AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                    return;
                }

                if (!currValue) return;
                this.clearNotifications();

                if (currId === 'SerialNumber' && !AppJsonModel.getProperty('/Editable').ValueHelpSerialNumber) return;

                if (currId === 'WorkCenter' && currWorkCenters.length > 0) {
                    for (let wc in currWorkCenters) {
                        if (currWorkCenters[wc].WorkCenter === currValue) {
                            this.byId(currId).setValueState("None");
                            break;
                        }

                        this.byId(currId).setValueState("Error");
                        this.byId(currId).setValueStateText(`Value ${currValue} does not exists`);
                        this.toggleSaveButton();
                    }

                    return;
                }

                if (currId === 'Equipment' && currEquipments.length > 0) {
                    for (let eq in currEquipments) {
                        if (currEquipments[eq].Equipment === currValue) {
                            this.byId(currId).setValueState("None");
                            this.toggleSaveButton();
                            break;
                        }

                        this.byId(currId).setValueState("Error");
                        this.byId(currId).setValueStateText(`Value ${currValue} does not exists`);
                        this.toggleSaveButton();
                    }

                    return;
                }

                MatchcodesService.callGetService(sPath, aFilters).then(data => {
                    let response = data.results;

                    if (!response.length) {
                        this.byId(currId).setValueState("Error");
                        this.byId(currId).setValueStateText(`Value ${currValue} does not exists`);
                        this.toggleSaveButton();
                        // MessageBox.error(`Value ${currValue} does not exists`);
                        // AppJsonModel.setInnerProperty('/DefectInfo', currId, '');
                        return;
                    }

                    if (currId === 'Plant' || currId === 'WorkCenter') {
                        this.saveDefaultValue();
                    }

                    if (response.length === 1 && currId === 'ProductionOrder') {
                        let material = response[0].Material;
                        let uom = response[0].UnitOfMeasure;
                        let needSerialNumber = response[0].NeedSerialNumber;
                        this.byId(currId).setValueState("None");
                        AppJsonModel.setInnerProperty('/DefectInfo', 'Material', material);
                        AppJsonModel.setInnerProperty('/DefectInfo', 'UnitOfMeasure', uom);
                        AppJsonModel.setInnerProperty('/Enabled', 'Material', false);
                        needSerialNumber
                            ? AppJsonModel.setInnerProperty('/Editable', 'ValueHelpSerialNumber', true)
                            : AppJsonModel.setInnerProperty('/Editable', 'ValueHelpSerialNumber', false)
                    }

                    if ((response.length === 1 || response.length > 0) && currId === 'Equipment') {
                        this.byId(currId).setValueState("None");
                    }

                    if (defectInfo.ProductionOrder && defectInfo.ProductOrderOperation) {
                        this.getBoomMaterials();
                    }
                }).catch((error) => {
                    console.log(error);
                })
            },

            submitWorkCenter: function (oEvent) {
                let currValue = oEvent.getParameter("value");
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let currId = oEvent.getParameter("id").split('--').pop();
                let sPath = this.getCurrentSpath(currId).path;
                let aFilters = this.getFilterForSubmit(currId);
                let currWorkCenters = AppJsonModel.getProperty('/WorkCenters');

                MatchcodesService.callGetService(sPath, aFilters).then(data => {
                    let response = data.results;

                    if (!response.length) {
                        if (currWorkCenters.length > 0) {
                            for (let wc in currWorkCenters) {
                                if (currWorkCenters[wc].WorkCenter === currValue) {
                                    this.byId(currId).setValueState("None");
                                    this.saveDefaultValue();
                                    break;
                                }

                                this.byId(currId).setValueState("Error");
                                this.byId(currId).setValueStateText(`Value ${currValue} does not exists`);
                                this.toggleSaveButton();
                            }
                        }
                        // this.byId(currId).setValueState("Error");
                        // this.byId(currId).setValueStateText(`Value ${currValue} does not exists`);
                        // this.toggleSaveButton();
                    }

                    if (response.length > 0) {
                        this.byId(currId).setValueState("None");
                        this.saveDefaultValue();
                        return
                    }
                }).catch((error) => {
                    console.log(error);
                })
            },

            onSubmitFilter: function (oEvent) {
                let currName = oEvent.getSource().getName();
                let currValue = oEvent.getParameter("value");
                let aFilters = [];

                if (!currValue.startsWith('*') && !currValue.endsWith('*')) {
                    aFilters.push(new Filter(currName, FilterOperator.Contains, currValue));
                } else if (currValue.startsWith('*') && currValue.endsWith('*')) {
                    aFilters.push(new Filter(currName, FilterOperator.Contains, currValue.slice(1, -1)));
                } else if (currValue.startsWith('*')) {
                    aFilters.push(new Filter(currName, FilterOperator.EndsWith, currValue.slice(1)));
                } else if (currValue.endsWith('*')) {
                    aFilters.push(new Filter(currName, FilterOperator.StartsWith, currValue.slice(0, -1)));
                }

                this.getFragment(`${inputId}HelpDialog`).then(oFragment => {
                    let oBindingInfo = oFragment.getTable().getBinding("rows");

                    if (inputId === 'ElementCode' || inputId === 'DefectCode' || inputId === 'CauseCodeGruppe' || inputId === 'CauseCode') {
                        // Guardamos los filtros previos
                        let prevFilters = oBindingInfo.aApplicationFilters;
                        // Limpiamos los filtros para actualizarlos
                        oBindingInfo.aApplicationFilters = [];

                        // Actualizamos filtros con los previos + los nuevos
                        if (aFilters.length) {
                            let oFilters = new Filter({
                                filters: [...prevFilters[0], ...aFilters],
                                and: true // false
                            });

                            oBindingInfo.filter(oFilters);
                            oFragment.update();
                            // Volvemos a setear los filtros iniciales para no perderlos
                            oBindingInfo.aApplicationFilters = prevFilters;
                            return;
                        }
                    }

                    if (aFilters.length) {
                        let oFilters = new Filter({
                            filters: aFilters,
                            and: true // false
                        });

                        oBindingInfo.filter(oFilters);
                        oFragment.update();
                        return;
                    }

                    oBindingInfo.filter([]);
                    oFragment.update();
                })
            },

            onSubmitQuantity: function () {
                this.getBoomMaterials();
            },

            getBoomMaterials: function () {
                const that = this;
                const oModel = this.getOwnerComponent().getModel();
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();;
                const returnLogMsg = oResourceBundle.getText("returnLogMsg");

                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let jsonModel = this.getOwnerComponent().getModel('boomData');
                let bomTable = this.byId('bomTable');
                let currentProdOrder = defectInfo.ProductionOrder;
                let currentProdOrderPlan = defectInfo.ProductOrderOperation;
                let currentWorkCenter = defectInfo.WorkCenter;
                let currentQuantity = defectInfo.Quantity;
                let saveBtn = this.getView().byId('saveBtn');

                if (!currentProdOrder && !currentProdOrderPlan) {
                    this.byId("ProductionOrder").setValueState("Error");
                    this.byId("ProductOrderOperation").setValueState("Error");
                    return;
                }

                if (!currentProdOrder) {
                    this.byId("ProductionOrder").setValueState("Error");
                    return;
                }

                if (!currentProdOrderPlan) {
                    this.byId("ProductOrderOperation").setValueState("Error");
                    return;
                }

                let aFilters = [new Filter("ProdOrder", FilterOperator.EQ, currentProdOrder), new Filter('ProdOrderOpPlan', FilterOperator.EQ, currentProdOrderPlan), new Filter("WorkCtr", FilterOperator.EQ, currentWorkCenter), new Filter("ComplainQty", FilterOperator.EQ, currentQuantity)];

                bomTable.setBusy(true);
                oModel.read("/ZfmGetBomSet", {
                    filters: aFilters,
                    success: function (data) {
                        let boomDataValues = [];
                        materialFilters = [];
                        batchFilters = [];
                        boomForSave = [];

                        if (data.results.length === 0) {
                            jsonModel.setData(boomDataValues);
                            saveBtn.setEnabled(false);
                            sap.m.MessageBox.show(`No hay materiales asociados a la orden ${currentProdOrder}`)
                            return;
                        }

                        let objNames = Object.keys(data.results[0]);

                        for (let i = 0; i < data.results.length; i++) {
                            let objValues = {
                                CompUnit: data.results[i][objNames[1]],
                                ProdOrder: data.results[i][objNames[2]],
                                WorkCtr: data.results[i][objNames[3]],
                                ComplainQty: data.results[i][objNames[4]],
                                ProdOrderOpPlan: data.results[i][objNames[5]],
                                ReturnLog: data.results[i][objNames[6]],
                                ItemNo: data.results[i][objNames[7]],
                                Component: data.results[i][objNames[8]],
                                CompQty: data.results[i][objNames[9]],
                                Charg: data.results[i][objNames[10]],
                                Licha: data.results[i][objNames[11]],
                                IssueLoc: data.results[i][objNames[12]],
                                BinEwm: data.results[i][objNames[13]],
                                WhEwm: data.results[i][objNames[14]],
                                Message: data.results[i][objNames[15]],
                            }

                            materialFilters.push(data.results[i][objNames[5]]);
                            batchFilters.push(data.results[i][objNames[10]]);

                            if (objValues.ReturnLog) {
                                // sap.m.MessageBox.error(`${objValues.ReturnLog}`);
                                bomTable.setNoDataText(returnLogMsg);
                                jsonModel.setData(boomDataValues);
                                bomTable.setBusy(false);
                                that.clearNotifications();
                                return;
                            }

                            if (!objValues.ReturnLog && !objValues.Message) {
                                // saveBtn.setEnabled(true);
                            } else if (!objValues.ReturnLog && objValues.Message && that.getChechStatus()) {
                                saveBtn.setEnabled(false);
                            }

                            boomForSave.push(objValues);
                            boomDataValues.push(objValues);
                        }

                        let noStockMsg = boomDataValues.filter(boom => boom.Message);

                        // noStockMsg.length > 0 ? saveBtn.setEnabled(false) : saveBtn.setEnabled(true);
                        jsonModel.setData(boomDataValues);
                        bomTable.setBusy(false);
                        that.toggleSaveButton();
                    },
                    error: function (error) {
                        console.log(error)
                    }
                })
            },

            getMaterialSet: function () {
                let oModel = this.getOwnerComponent().getModel();
                let currentProdOrder = this.getView().byId("productionOrder").getValue();
                let aFilter = new Filter("ProdOrder", FilterOperator.EQ, currentProdOrder);
                let materialInput = this.getView().byId('Idrnk');
                let batchInput = this.getView().byId('batch');

                if (currentProdOrder) {
                    oModel.read(`/ZfmGetMaterialSet('${currentProdOrder}')`, {
                        filter: aFilter,
                        success: function (data) {
                            let { Batch: batch, Material: material } = data;

                            materialInput.setValue(material);
                            materialInput.setEnabled(false);
                            batchInput.setValue(batch);
                        },
                        error: function (error) {
                            console.log(error);
                        }
                    })
                }
            },

            getChechStatus: function () {
                let checkBox = this.getView().byId('moveStock');
                return checkBox.getSelected();
            },

            getFragment: function (sFragmentName) {
                if (!this.oFragments[sFragmentName]) {
                    this.oFragments[sFragmentName] = sap.ui.xmlfragment(this.getView().getId(), "zdom.zdom.view.fragments." +
                        sFragmentName, this);
                    this.getView().addDependent(this.oFragments[sFragmentName]);
                }
                return Promise.resolve(this.oFragments[sFragmentName]);
            },

            // BAPI CALL

            onPressSave: function (oEvent) {
                let that = this;
                let currBtnId = oEvent.getSource().getId().split('-').pop();
                let oModel = this.getOwnerComponent().getModel();
                let emptyFields = this.checkValueState();
                if (emptyFields) return;

                let sBusy = "Procesando...";
                let busyDialog4 = (sap.ui.getCore().byId("busy4")) ? sap.ui.getCore().byId("busy4") : new sap.m.BusyDialog('busy4', {
                    title: sBusy
                });

                let defectInfoValues = AppJsonModel.getProperty('/DefectInfo');

                let oParameters = {
                    IvAufnr: defectInfoValues.ProductionOrder,
                    IvIsStockMovement: this.getChechStatus(),
                    IvSerialno: defectInfoValues.SerialNumber,
                    IvSortf: defectInfoValues.ProductOrderOperation,
                    IvWerks: defectInfoValues.Plant,
                    IvWorkCtr: defectInfoValues.WorkCenter,
                    IvComplainQty: parseFloat(defectInfoValues.Quantity).toFixed(3),
                    IvRepCode: defectInfoValues.RepairCode,
                    IvDlCode: defectInfoValues.ElementCode,
                    IvDCode: defectInfoValues.DefectCode,
                    IvCauseCodegruppe: defectInfoValues.CauseCodeGruppe,
                    IvCauseCode: defectInfoValues.CauseCode,
                    IvEqnr: defectInfoValues.Equipment,
                    EvAufnr: defectInfoValues.ProductionOrder,
                    BomItemSet: boomForSave.map((boomItem, index) => {
                        return {
                            ItemNo: boomItem.ItemNo,
                            Component: boomItem.Component,
                            CompQty: boomItem.CompQty.trim(),
                            Charg: boomItem.Charg,
                            Licha: boomItem.Licha,
                            IssueLoc: boomItem.IssueLoc,
                            Message: boomItem.Message,
                            ChangeNo: boomItem.ProdOrderOpPlan,
                            CompUnit: boomItem.CompUnit,
                            BinEwm: boomItem.BinEwm,
                            WhEwm: boomItem.WhEwm,
                        }
                    }),
                    ReturnSet: []
                }

                busyDialog4.open();

                if (currBtnId === 'saveAndDupBtn') {
                    oModel.create('/ZfmSaveDefectSet', oParameters, {
                        headers: {
                            "Content-Type": "application/json"
                        },
                        success: function (res) {
                            oMessagePopover.getModel().setData('');
                            let resMessages = res.ReturnSet.results.map(msgs => msgs);
                            let w_data = [];

                            resMessages.forEach(msg => {
                                w_data.push({
                                    T: that.setMessageType(msg.Type),
                                    S: msg.Message
                                })
                            })

                            let prevMsgs = Array.from(oMessagePopover.getModel().getData());
                            let upDatedMsgs = [...prevMsgs, ...w_data];
                            oMessagePopover.getModel().setData(upDatedMsgs);
                            oMessagePopover.getModel().refresh(true);
                            that.getView().getModel('popoverModel').getData().messageLength = upDatedMsgs.length;
                            that.getView().getModel('popoverModel').getData().type = "Emphasized";
                            that.getView().getModel('popoverModel').refresh(true);
                            busyDialog4.close();
                        },
                        error: function (error) {
                            sap.m.MessageBox.error("ERROR occurred during BAPI call");
                            busyDialog4.close();
                            console.log(error);
                        }

                    })
                } else {
                    oModel.create('/ZfmSaveDefectSet', oParameters, {
                        headers: {
                            "Content-Type": "application/json"
                        },
                        success: function (res) {
                            oMessagePopover.getModel().setData('');
                            let resMessages = res.ReturnSet.results.map(msgs => msgs);
                            let w_data = [];

                            resMessages.forEach(msg => {
                                w_data.push({
                                    T: that.setMessageType(msg.Type),
                                    S: msg.Message
                                })
                            })

                            let prevMsgs = Array.from(oMessagePopover.getModel().getData());
                            let upDatedMsgs = [...prevMsgs, ...w_data];
                            oMessagePopover.getModel().setData(upDatedMsgs);
                            oMessagePopover.getModel().refresh(true);
                            that.getView().getModel('popoverModel').getData().messageLength = upDatedMsgs.length;
                            that.getView().getModel('popoverModel').getData().type = "Emphasized";
                            that.getView().getModel('popoverModel').refresh(true);
                            busyDialog4.close();
                            that.clearData();
                        },
                        error: function (error) {
                            sap.m.MessageBox.error("ERROR occurred during BAPI call");
                            busyDialog4.close();
                            console.log(error);
                        }

                    })
                }
            },

            // checkEquipment: function () {
            //     const equipmentInput = this.byId('Equipment');
            //     const currPlant = AppJsonModel.getProperty('/DefectInfo').Plant;
            //     const currWorkcenter = AppJsonModel.getProperty('/DefectInfo').WorkCenter;
            //     const oFilter = [new Filter('Plant', FilterOperator.EQ, currPlant), new Filter('WorkCenter', FilterOperator.EQ, currWorkcenter)];

            //     let equipments = AppJsonModel.getProperty('/Equipments');
            //     MatchcodesService.callGetService('/MatchCodeEquipment', oFilter).then(data => {
            //         const response = data.results;

            //         if (response.length > 1) {

            //             equipments = [];
            //             response.forEach(eq => {
            //                 equipments.push({
            //                     Description: `${eq.Description}`,
            //                     Equipment: `${eq.Equipment}`,
            //                     Plant: `${eq.Plant}`,
            //                     SortField: `${eq.SortField}`,
            //                     WorkCenter: `${eq.WorkCenter}`
            //                 })
            //             })

            //             AppJsonModel.setProperty('/Equipments', equipments);
            //             equipmentInput.setValue('');
            //             equipmentInput.setEditable(true);
            //             equipmentInput.setShowValueHelp(true);
            //             return;
            //         }

            //         if (response.length === 1) {
            //             equipmentInput.setValue(response[0].Equipment);
            //             equipmentInput.setValueState('None');
            //             equipmentInput.setEditable(false);
            //             equipmentInput.setShowValueHelp(false);
            //             return;
            //         }

            //         if (response.length === 0) {
            //             AppJsonModel.setProperty('/Equipments', []);
            //             equipmentInput.setValueState('None');
            //             equipmentInput.setValue('');
            //             equipmentInput.setEditable(true);
            //             equipmentInput.setShowValueHelp(true);
            //             return;
            //         }
            //     })
            // },

            onInputChange: function (oEvent) {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const noDataText = oResourceBundle.getText("noData");

                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let bomModel = this.getOwnerComponent().getModel('boomData');
                let bomTable = this.byId("bomTable");
                let currValue = oEvent.getParameters().value;
                let currId = oEvent.getParameter("id").split('--').pop();

                if (currId === 'ProductOrderOperation' && !currValue) {
                    this.byId(currId).setValueState("None");
                    bomModel.setData({});
                    bomTable.setNoDataText(noDataText);
                    this.clearNotifications();
                    return;
                }

                if (currId === 'ProductionOrder' && !currValue) {
                    this.byId(currId).setValueState("None");
                    AppJsonModel.setInnerProperty('/DefectInfo', 'Material', '');
                    AppJsonModel.setInnerProperty('/DefectInfo', 'UnitOfMeasure', '');
                    AppJsonModel.setInnerProperty('/Enabled', 'Material', true);
                    AppJsonModel.setInnerProperty('/Editable', 'ValueHelpSerialNumber', true);
                    bomModel.setData({});
                    bomTable.setNoDataText(noDataText);
                    this.clearNotifications();
                    return;
                }

                if (currId === 'SerialNumber' && !currValue) {
                    this.byId(currId).setValueState('None');
                    return;
                }

                if (currId === 'Quantity' && (defectInfo.ProductionOrder && defectInfo.ProductOrderOperation)) {
                    this.getBoomMaterials();
                    return
                }

                if (currId === 'WorkCenter') {
                    this.byId(currId).setValue(oEvent.getParameter("value").toUpperCase());
                    this.byId(currId).setValueState("None");

                    // FUNCTION TO AUTOCOMPLETE EQUIPMENT
                    // this.checkEquipment();
                    return;
                }

                if (currValue) {
                    this.byId(currId).setValueState("None");
                }
            },

            setMessageType: function (oMessage) {
                switch (oMessage) {
                    case 'S':
                        return 'Success'
                    case 'E':
                        return 'Error'
                    case 'W':
                        return 'Warning'
                    case 'I':
                        return 'Information'
                    case 'A':
                        return 'Abort'

                }
            },

            onCheck: function (oEvent) {
                let selected = oEvent.getParameter('selected');
                this.toggleSaveButton()
                return selected;
            },

            toggleSaveButton: function () {
                let boomMessages = boomForSave.filter(item => item.Message);
                let stockChecked = this.getChechStatus();
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let defectInfoKeys = Object.keys(defectInfo);
                let filterInfo = defectInfoKeys.filter(item => item !== "UnitOfMeasure" && item !== "SerialNumber" && item !== "DefectCode");
                let equipmentStateError = this.byId('Equipment').getValueState();

                let emptyInputs = 0;
                for (let key of filterInfo) {
                    if (!defectInfo[key]) {
                        emptyInputs++;
                    }
                }

                if (equipmentStateError === 'Error') {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    return;
                }

                if ((!emptyInputs && boomMessages.length === 0) || (!emptyInputs && boomMessages.length > 0 &&  equipmentStateError !== 'Error')) {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', true);
                    return;
                }


                // if ((!emptyInputs && !stockChecked) || (stockChecked && boomForSave.length > 0 && boomMessages.length === 0)) {
                //     AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', true);
                //     return;
                // }

                // if (!emptyInputs && stockChecked && (boomForSave.length === 0 || boomMessages.length > 0)) {
                //     AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                //     return;
                // }
            },

            checkValueState: function () {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let defectInfoKeys = Object.keys(defectInfo);
                let filterInfo = defectInfoKeys.filter(item => item !== "UnitOfMeasure" && item !== "SerialNumber");

                let emptyInputs = 0;
                for (let key of filterInfo) {
                    if (!defectInfo[key]) {
                        this.byId(key).setValueState("Error");
                        emptyInputs++;
                    }
                }

                if (emptyInputs > 0) return true;

                return false;
            },

            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            }
        });

    });
