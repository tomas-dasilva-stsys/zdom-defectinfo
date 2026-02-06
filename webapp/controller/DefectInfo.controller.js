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
    "zdom/zdom/model/AppJsonModel",
    "zdom/zdom/model/formatter",
    "sap/m/MessageToast",
],
    function (Controller,
        JSONModel,
        Fragment,
        Filter,
        FilterOperator,
        ODataModel,
        MessagePopover,
        MessagePopoverItem,
        MessageBox,
        Service,
        MatchcodesService,
        AppJsonModel,
        formatter,
        MessageToast,
    ) {
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
            formatter: formatter,
            oFragments: {},

            onInit: function () {
                AppJsonModel.initializeModel();
                let sLocale = sap.ui.getCore().getConfiguration().getLanguage();
                let i18nModel = new sap.ui.model.resource.ResourceModel({
                    bundleName: "zdom.zdom.i18n.i18n",
                    bundleLocale: sLocale
                });

                this.getView().setModel(i18nModel, "i18n");
                this.formatter = formatter

                let pop_msgModel = new sap.ui.model.json.JSONModel({
                    "messageLength": '',
                    "type": 'Default'
                })

                this.getView().setModel(pop_msgModel, "popoverModel");
                let popModel = new sap.ui.model.json.JSONModel({});
                oMessagePopover.setModel(popModel);

                this.toggleSaveButton();

                // if (sap.ushell && sap.ushell.Container) {
                //     let oUser = sap.ushell.Container.getService("UserInfo");
                //     let sUserId = oUser.getId();
                //     let sFullName = oUser.getFullName();
                //     let sEmail = oUser.getEmail();

                //     console.log("Usuario ID: " + sUserId);
                //     console.log("Nombre completo: " + sFullName);
                // }

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

                            this.checkEquipment();
                            this.checkProductOrderOperation();
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

                            this.checkEquipment();
                            this.checkProductOrderOperation();
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
                        this.checkEquipment();
                        this.checkProductOrderOperation();
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
                        if (defectInfo.WorkCenter) {
                            aFilter.push(new Filter("WorkCenter", FilterOperator.EQ, defectInfo.WorkCenter));
                        }
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
                AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                AppJsonModel.setInnerProperty('/Editable', 'ElementCode', true);
                AppJsonModel.setInnerProperty('/Editable', 'DefectCode', true);
                AppJsonModel.setInnerProperty('/Editable', 'ProductOrderOperation', true);

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
                let that = this;
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

            // VERSION ACTUAL
            // onValueHelpRequestProductionOrder: function (oEvent) {
            //     const that = this;

            //     const currentInputId = oEvent.getSource().getId().split("--").at(-1);
            //     const oFilters = this.getCurrentFilter("ProductionOrder");

            //     inputId = currentInputId;

            //     this.getFragment("ProductionOrderHelpDialog").then(oFragment => {

            //         oFragment.getTableAsync().then(oTable => {
            //             // Modelos
            //             oTable.setModel(MatchcodesService.getOdataModel());
            //             const tableCols = AppJsonModel.getProperty("/ProductionOrder");
            //             const currentJsonModel = new JSONModel({ cols: tableCols });
            //             oTable.setModel(currentJsonModel, "columns");

            //             // Binding de filas
            //             oTable.bindRows({
            //                 path: "/MatchCodeProductionOrder",
            //                 filters: oFilters
            //             });

            //             const oBinding = oTable.getBinding("rows");
            //             const oFilterBar = oFragment.getFilterBar();
            //             const oGoButton = oFilterBar?._oSearchButton;
            //             if (!oGoButton) {
            //                 console.warn("No se encontró el botón GO del FilterBar");
            //                 return;
            //             }

            //             // ------------------------------------------------------------------
            //             // EJECUTAR GO SOLO CUANDO TODO EL BINDING + RENDERING TERMINÓ
            //             // ------------------------------------------------------------------

            //             // Espera a que el backend devuelva los datos
            //             // oBinding.attachEventOnce("dataReceived", (oEvent) => {
            //             //     let renderTimer;

            //             //     console.log({oEvent});
            //             //     // const waitForFinalRender = () => {
            //             //     //     clearTimeout(renderTimer);

            //             //     //     // 200ms sin rowsUpdated = tabla completamente estable
            //             //     //     renderTimer = setTimeout(() => {
            //             //     //         console.log("Tabla cargada y estable → ejecutando GO");

            //             //     //         // Ejecutamos el GO exactamente cuando corresponde
            //             //     //         oGoButton.firePress();

            //             //     //         // Ya no necesitamos escuchar más
            //             //     //         oTable.detachRowsUpdated(waitForFinalRender);
            //             //     //     }, 200);
            //             //     // };

            //             //     // Escuchar todas las actualizaciones de filas
            //             //     // oTable.attachRowsUpdated(waitForFinalRender);
            //             // });
            //             let bGoExecuted = false;
            //             oTable.attachEvent("rowsUpdated", function () {
            //                 if (bGoExecuted) return;

            //                 let oBinding = oTable.getBinding("rows");

            //                 // ¿Quedan requests pendientes?
            //                 let bPending = oBinding.bPendingRequest;

            //                 console.log("rowsUpdated – pending:", bPending,
            //                     "final length:", oBinding.iLength);

            //                 // Si todavía hay requests pendientes → no hacer nada
            //                 if (bPending) return;

            //                 // Si ya NO hay pedidos pendientes → ya terminó la carga completa
            //                 console.log("🔥 Tabla COMPLETAMENTE cargada con", oBinding.iLength, "filas");

            //                 // disparamos el GO
            //                 if (!bGoExecuted) {
            //                     bGoExecuted = true;
            //                     oGoButton.firePress();
            //                 }
            //             });


            //             // oTable.setBusy(true);
            //             oFragment.update();
            //         });

            //         oFragment.open();
            //     });
            // },

            onValueHelpRequestProductionOrder: function (oEvent) {
                const currentInputId = oEvent.getSource().getId().split('--').at(-1);
                inputId = currentInputId;

                let oFilters = this.getCurrentFilter('ProductionOrder');

                this.getFragment(`${currentInputId}HelpDialog`).then(oFragment => {
                    oFragment.open();

                    oFragment.attachAfterOpen(() => {
                        oFragment.getTableAsync().then(oTable => {

                            oTable.setModel(MatchcodesService.getOdataModel())
                            const cols = AppJsonModel.getProperty('/ProductionOrder')
                            const colsModel = new JSONModel({ "cols": cols })
                            oTable.setModel(colsModel, "columns");

                            // if (oTable.bindRows) {
                            //     oTable.bindAggregation("rows", {
                            //         path: '/MatchCodeProductionOrder',
                            //         filters: oFilters,
                            //         showHeader: false
                            //     });
                            // }

                            oTable.setModel(new JSONModel([]));
                            oTable.bindRows('/');
                            oTable.setBusy(true);

                            let oFilterBar = oFragment.getFilterBar();

                            setTimeout(() => {
                                if (oFilterBar) {
                                    let oGoButton = oFilterBar._oSearchButton; // botón interno "Go"
                                    if (oGoButton) {
                                        oGoButton.firePress(); // simula el clic real
                                    }
                                }
                            }, 50)
                        })
                    })
                })
            },

            // onFilterBarSearchProductionOrder: async function (oEvent) {

            //     const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
            //     const statusFilterValue = oResourceBundle.getText('statusFilterValue');
            //     const deleteFlagValue = oResourceBundle.getText('deleteFlagValue');
            //     const statusOptions = ['REL', 'LIB', 'LIB.'];

            //     const aSelectionSet = oEvent.getParameter("selectionSet");

            //     const releaseDate = new Date(aSelectionSet[2]?.getValue());
            //     let releaseDateTo = new Date(aSelectionSet[3]?.getValue());
            //     if (!releaseDateTo.getDate()) releaseDateTo = releaseDate;

            //     // Filtros del usuario
            //     const aFilters = this.setProdOrderFilters(aSelectionSet, releaseDate, releaseDateTo);

            //     // Detectar si se filtró por Status con valores REL/LIB/LIB.
            //     const userStatusFilter = aSelectionSet[1]?.getValue?.() || "";
            //     const cleanStatusFilter = userStatusFilter?.replace(/^\*+|\*+$/g, "");
            //     const isClientSideStatus = statusOptions.includes(cleanStatusFilter.toUpperCase().trim());

            //     // Obtener fragment y tabla
            //     const oFragment = await this.getFragment('ProductionOrderHelpDialog');
            //     const oTable = await oFragment.getTableAsync();
            //     const oModelProdOrder = MatchcodesService.getOdataModel();
            //     const oBaseFilter = this.getCurrentFilter(inputId);

            //     // Busy inmediato
            //     oTable.setBusyIndicatorDelay(0);
            //     oTable.setBusy(true);

            //     // Mostrar el dialog
            //     if (!oFragment.isOpen || !oFragment.isOpen()) {
            //         oFragment.open();
            //     }

            //     // ----------------- Helpers -----------------

            //     const filterInChunks = (aData, aFilters, chunkSize = 500) => {
            //         return new Promise(resolve => {
            //             const result = [];
            //             let index = 0;

            //             const processChunk = () => {
            //                 const end = Math.min(index + chunkSize, aData.length);

            //                 for (; index < end; index++) {
            //                     const item = aData[index];
            //                     if (_itemMatches(item, aFilters)) result.push(item);
            //                 }
            //                 if (index < aData.length) {
            //                     setTimeout(processChunk, 0);
            //                 } else {
            //                     resolve(result);
            //                 }
            //             }

            //             processChunk();
            //         });
            //     };

            //     const _itemMatches = (item, filters) => {
            //         return filters.every(f => {

            //             const op = f.sOperator || "Contains";
            //             const path = f.sPath;
            //             const itemValue = item[path];
            //             const v1 = f.oValue1;
            //             const v2 = f.oValue2;

            //             // Fecha
            //             const isDate = !isNaN(Date.parse(itemValue));
            //             if (isDate) {
            //                 const dItem = new Date(itemValue);
            //                 const d1 = new Date(v1);
            //                 const d2 = v2 ? new Date(v2) : null;

            //                 if (!d2 || isNaN(d2)) {
            //                     switch (op) {
            //                         case "EQ": return dItem.toDateString() === d1.toDateString();
            //                         case "GT": return dItem > d1;
            //                         case "LT": return dItem < d1;
            //                         default: return true;
            //                     }
            //                 } else {
            //                     return dItem >= d1 && dItem <= d2;
            //                 }
            //             }

            //             // Texto
            //             const itemStr = (itemValue || "").toString().toLowerCase();
            //             const filterStr = (v1 || "").toString().toLowerCase();

            //             switch (op) {
            //                 case "EQ": return itemStr === filterStr;
            //                 case "StartsWith": return itemStr.startsWith(filterStr);
            //                 case "EndsWith": return itemStr.endsWith(filterStr);
            //                 case "Contains": return itemStr.includes(filterStr);
            //                 default: return true;
            //             }
            //         });
            //     };

            //     function applyData(oTableRef, data) {

            //         const titleMsg = oResourceBundle.getText('items', data.length)
            //         // Limpiar columnas
            //         oTableRef.removeAllColumns();
            //         const tableCols = AppJsonModel.getProperty(`/${inputId}`) || [];

            //         tableCols.forEach(col => {
            //             const sPath = col.template;
            //             const column = new sap.ui.table.Column({
            //                 label: new sap.ui.commons.Label({ text: col.label }),
            //                 template: new sap.ui.commons.TextView({ text: `{${sPath}}` }),
            //                 width: col.width,
            //                 sortProperty: sPath
            //             });
            //             oTableRef.addColumn(column);
            //         });

            //         const oJSON = new JSONModel(data);
            //         oTableRef.setModel(oJSON);
            //         oTableRef.bindRows("/");
            //         oTableRef.setTitle(titleMsg);
            //     }

            //     // ----------------- LÓGICA PRINCIPAL -----------------

            //     try {

            //         // CASO 1 -> Sin filtros → Traer todo del backend
            //         if (aFilters.length === 0) {

            //             const oData = await new Promise((resolve, reject) => {
            //                 oModelProdOrder.read('/MatchCodeProductionOrder', {
            //                     urlParameters: { "$top": 10000 },
            //                     filters: [oBaseFilter],
            //                     showHeader: false,
            //                     success: r => resolve(r.results || []),
            //                     error: reject
            //                 });
            //             });

            //             applyData(oTable, oData);
            //             return;
            //         }

            //         // CASO 2 -> Filtro de Status = REL/LIB/LIB. → filtrado en cliente
            //         if (isClientSideStatus) {

            //             const rawData = await new Promise((resolve, reject) => {
            //                 oModelProdOrder.read('/MatchCodeProductionOrder', {
            //                     urlParameters: { "$top": 10000 },
            //                     showHeader: false,
            //                     filters: [oBaseFilter],
            //                     success: r => resolve(r.results || []),
            //                     error: reject
            //                 });
            //             });

            //             const filtered = await filterInChunks(rawData, aFilters);
            //             applyData(oTable, filtered);
            //             return;
            //         }

            //         // CASO 3 -> filtros normales (backend)
            //         const backendFilter = new sap.ui.model.Filter({
            //             filters: aFilters,
            //             and: true
            //         });

            //         const oBinding = oTable.getBinding("rows");
            //         oBinding.filter(backendFilter);
            //         const titleMsg = oResourceBundle.getText('items', oBinding.iLength)
            //         oTable.setTitle(titleMsg);
            //     } catch (err) {
            //         console.error(err);
            //     } finally {
            //         oTable.setBusy(false);
            //     }
            // },

            onFilterBarSearchProductionOrder: async function (oEvent) {

                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const statusOptions = ['REL', 'LIB', 'LIB.'];

                const aSelectionSet = oEvent.getParameter("selectionSet");

                const releaseDate = new Date(aSelectionSet[2]?.getValue());
                let releaseDateTo = new Date(aSelectionSet[3]?.getValue());
                if (!releaseDateTo.getDate()) releaseDateTo = releaseDate;

                // Filtros generados por el usuario
                const aFilters = this.setProdOrderFilters(aSelectionSet, releaseDate, releaseDateTo);

                // Status especial para filtrado en cliente
                const userStatusFilter = aSelectionSet[1]?.getValue?.() || "";
                const cleanStatusFilter = userStatusFilter.replace(/^\*+|\*+$/g, "");
                const isClientSideStatus = statusOptions.includes(cleanStatusFilter.toUpperCase().trim());

                // Fragment y tabla
                const oFragment = await this.getFragment('ProductionOrderHelpDialog');
                const oTable = await oFragment.getTableAsync();
                const oModel = MatchcodesService.getOdataModel();
                const oBaseFilter = this.getCurrentFilter(inputId);

                oTable.setBusyIndicatorDelay(0);
                oTable.setBusy(true);

                if (!oFragment.isOpen || !oFragment.isOpen()) {
                    oFragment.open();
                }

                // ============================================================
                // =========== UNIVERSAL ODATA FULL-READ WITH __next ==========
                // ============================================================

                async function readAllOData(oModel, entitySet, params = {}, filters = []) {

                    function _read(url) {
                        return new Promise((resolve, reject) => {
                            oModel.read(url, {
                                urlParameters: params,
                                filters,
                                success: resolve,
                                error: reject
                            });
                        });
                    }

                    let all = [];
                    let next = entitySet;
                    let firstCall = true;

                    while (next) {
                        const data = await _read(next, firstCall ? params : {});

                        if (data.results) {
                            all.push(...data.results);
                        }

                        next = data.__next || null;

                        // __next puede venir con URL absoluta → normalizamos
                        if (next) {
                            // Siempre traer solo el path a partir del entitySet
                            const idx = next.indexOf(entitySet.replace("/", ""));
                            if (idx > -1) {
                                next = "/" + next.substring(idx);
                            } else {
                                // quitar host+service completo
                                const clean = next.replace(oModel.sServiceUrl, "");
                                next = clean.startsWith("/") ? clean : "/" + clean;
                            }
                        }

                        firstCall = false
                    }

                    return all;
                }

                // ============================================================
                // ================ FILTRADO CLIENT-SIDE CHUNKED ==============
                // ============================================================

                const _itemMatches = (item, filters) => {
                    return filters.every(f => {

                        const op = f.sOperator;
                        const path = f.sPath;
                        const itemValue = item[path];
                        const v1 = f.oValue1;
                        const v2 = f.oValue2;

                        // Fecha
                        if (!isNaN(Date.parse(itemValue))) {
                            const dItem = new Date(itemValue);
                            const d1 = new Date(v1);
                            const d2 = v2 ? new Date(v2) : null;

                            if (!d2 || isNaN(d2)) {
                                switch (op) {
                                    case "EQ": return dItem.toDateString() === d1.toDateString();
                                    case "GT": return dItem > d1;
                                    case "LT": return dItem < d1;
                                    default: return true;
                                }
                            } else {
                                return dItem >= d1 && dItem <= d2;
                            }
                        }

                        // Texto
                        const itemStr = (itemValue || "").toString().toLowerCase();
                        const filterStr = (v1 || "").toString().toLowerCase();

                        switch (op) {
                            case "EQ": return itemStr === filterStr;
                            case "StartsWith": return itemStr.startsWith(filterStr);
                            case "EndsWith": return itemStr.endsWith(filterStr);
                            case "Contains": return itemStr.includes(filterStr);
                            default: return true;
                        }
                    });
                };

                async function filterInChunks(data, filters, chunk = 2000) {
                    const tasks = [];
                    for (let i = 0; i < data.length; i += chunk) {
                        const part = data.slice(i, i + chunk);
                        tasks.push(
                            new Promise(resolve => {
                                const out = part.filter(item => _itemMatches(item, filters));
                                resolve(out);
                            })
                        );
                    }
                    const results = await Promise.all(tasks);
                    return results.flat();
                }

                // ============================================================
                // ======================== APLICAR DATOS ======================
                // ============================================================

                function applyData(oTableRef, data) {

                    const titleMsg = oResourceBundle.getText('items', [data.length]);

                    oTableRef.removeAllColumns();

                    const tableCols = AppJsonModel.getProperty(`/${inputId}`) || [];

                    tableCols.forEach(col => {
                        const sPath = col.template;
                        const column = new sap.ui.table.Column({
                            label: new sap.ui.commons.Label({ text: col.label }),
                            template: new sap.ui.commons.TextView({ text: `{${sPath}}` }),
                            width: col.width,
                            sortProperty: sPath
                        });
                        oTableRef.addColumn(column);
                    });

                    const oJSON = new sap.ui.model.json.JSONModel(data);
                    oTableRef.setModel(oJSON);
                    oTableRef.bindRows("/");
                    oTableRef.setTitle(titleMsg);
                }

                // ============================================================
                // ======================= LÓGICA PRINCIPAL ====================
                // ============================================================

                try {

                    // === 1) Sin filtros → leer todo desde backend ===
                    if (aFilters.length === 0) {
                        const rawData = await readAllOData(
                            oModel,
                            "/MatchCodeProductionOrder",
                            { "$top": 50000, "$skip": 0 },
                            [oBaseFilter]
                        );
                        applyData(oTable, rawData);
                        return;
                    }

                    // === 2) Filtro especial de Status → filtrado del lado del cliente ===
                    if (isClientSideStatus) {
                        const rawData = await readAllOData(
                            oModel,
                            "/MatchCodeProductionOrder",
                            { "$top": 50000, "$skip": 0 },
                            [oBaseFilter]
                        );

                        const filtered = await filterInChunks(rawData, aFilters);
                        applyData(oTable, filtered);
                        return;
                    }

                    // === 3) Filtros normales → filtrado en backend ===
                    const backendFilter = new sap.ui.model.Filter({
                        filters: aFilters,
                        and: true
                    });

                    const oBinding = oTable.getBinding("rows");
                    oBinding.filter(backendFilter);

                    const titleMsg = oResourceBundle.getText('items', [oBinding.iLength]);
                    oTable.setTitle(titleMsg);

                } catch (err) {
                    console.error(err);
                } finally {
                    oTable.setBusy(false);
                }
            },

            _filterProductionOrders: function (aData, aFilters) {
                return aData.filter(item =>
                    aFilters.every(oFilter => {
                        let operator = oFilter.sOperator || 'Contains';
                        let path = oFilter.sPath;
                        let itemValue = item[path];
                        let value1 = oFilter.oValue1 ?? "";
                        let value2 = oFilter.oValue2 ?? "";

                        // ===== Fechas =====
                        const isDate = !isNaN(Date.parse(itemValue));
                        if (isDate) {
                            let dItem = new Date(itemValue);
                            let d1 = new Date(value1);
                            let d2 = new Date(value2);

                            switch (operator) {
                                case 'EQ': return dItem.toDateString() === d1.toDateString();
                                case 'GT': return dItem > d1;
                                case 'LT': return dItem < d1;
                                case 'BT': return dItem >= d1 && dItem <= d2;
                            }
                            return true;
                        }

                        // ===== Strings =====
                        let str = (itemValue ?? "").toString().toLowerCase();
                        let values = (value1 ?? "").toString().toLowerCase()
                            .split(/[\s\*]+/).filter(v => v);

                        switch (operator) {
                            case 'EQ': return values.some(v => str === v);
                            case 'StartsWith': return values.some(v => str.startsWith(v));
                            case 'EndsWith': return values.some(v => str.endsWith(v));
                            case 'Contains': return values.every(v => str.includes(v));
                            default: return true;
                        }
                    })
                );
            },

            _applyProdOrderTableData: function (oTable, aData) {

                let cleanData = aData.map(item => {
                    let clone = { ...item };
                    if (clone.ReleaseDate) {
                        clone.ReleaseDate = formatter.formatDate(clone.ReleaseDate);
                    }
                    return clone;
                });

                let oJSONModel = new JSONModel(cleanData);
                let tableCols = AppJsonModel.getProperty(`/${inputId}`);

                // limpiar columnas anteriores
                oTable.removeAllColumns();

                tableCols.forEach(col => {
                    oTable.addColumn(
                        new sap.ui.table.Column({
                            label: col.label,
                            template: new sap.ui.commons.TextView({ text: `{${col.template}}` }),
                            width: col.width,
                            sortProperty: col.template
                        })
                    );
                });

                oTable.setModel(oJSONModel);
                // oTable.setModel(new JSONModel({ cols: tableCols }), "columns");
                oTable.bindRows("/");

                // sort inicial
                oTable.attachEventOnce("rowsUpdated", () => {
                    let binding = oTable.getBinding("rows");
                    if (binding) {
                        let sortPath = tableCols[4].template;
                        binding.sort(new sap.ui.model.Sorter(sortPath, false));
                    }
                });
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
                debugger;

                let currentInputId = oEvent.getSource().getId().split('--').at(-1);
                let currentData = AppJsonModel.getProperty('/DefectInfo');
                let equipments = AppJsonModel.getProperty('/Equipments');
                let equipmentInput = this.byId('Equipment');

                inputId = currentInputId;

                // LOGIC TO FILTER EQUIPMENT BY WORKCENTER
                if (equipments.length > 0) {
                    this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                        oFragment.getTableAsync().then(function (oTable) {
                            let tableCols = equipments[0].WorkCenter ? AppJsonModel.getProperty("/Equipment") : AppJsonModel.getProperty("/Equipment2");
                            let currentJsonModel = new JSONModel({
                                "cols": tableCols
                            })

                            oTable.setModel(currentJsonModel, "columns");

                            let equipmentsModel = new JSONModel({
                                items: equipments
                            })

                            oTable.setModel(equipmentsModel);

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
                }

                if (equipments.length === 0) {
                    let equipmentPath = this.getCurrentSpath(inputId);
                    let oFilters = this.getCurrentFilter('Equipment');

                    MatchcodesService.callGetService(`${equipmentPath.path}`, [oFilters]).then(data => {
                        const response = data.results;

                        if (response.length === 0) {
                            let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                            // oFilters = [new Filter('Plant', FilterOperator.EQ, defectInfo.Plant), new Filter('WorkCenterL2', FilterOperator.EQ, defectInfo.WorkCenter)];

                            MatchcodesService.callGetService(`${equipmentPath.path}WrkCtr`, [oFilters]).then(data => {
                                const response = data.results;

                                if (response.length === 0) {
                                    oFilters = [new Filter('Plant', FilterOperator.EQ, defectInfo.Plant)];

                                    MatchcodesService.callGetService(`${equipmentPath.path}WrkCtr`, [oFilters]).then(data => {

                                        let noWcFilters = [
                                            new Filter(
                                                {
                                                    filters: [new Filter('Plant', FilterOperator.EQ, defectInfo.Plant)],
                                                    and: true
                                                }),

                                            new Filter({
                                                filters: [
                                                    new Filter('WorkCenter', FilterOperator.EQ, ''),
                                                    new Filter('WorkCenter', FilterOperator.EQ, null)],
                                                and: false
                                            }),

                                            new Filter({
                                                filters: [
                                                    new Filter('WorkCenterL2', FilterOperator.EQ, ''),
                                                    new Filter('WorkCenterL2', FilterOperator.EQ, null)],
                                                and: false
                                            }),
                                        ]

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
                                                        filters: noWcFilters,
                                                        and: true,
                                                        showHeader: false,
                                                    });
                                                }
                                                oFragment.update();
                                            });
                                            oFragment.open();
                                            return;
                                        })
                                    })
                                }

                                this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                                    oFragment.getTableAsync().then(function (oTable) {
                                        oTable.setModel(MatchcodesService.getOdataModel());
                                        let tableCols = AppJsonModel.getProperty("/Equipment2");
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
                }
                // let equipmentPath = this.getCurrentSpath(inputId);
                // let oFilters = this.getCurrentFilter('Equipment');
                // MatchcodesService.callGetService(`${equipmentPath.path}`, [oFilters]).then(data => {
                //     const response = data.results;

                //     if (response.length === 0) {
                //         this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                //             oFragment.getTableAsync().then(function (oTable) {
                //                 oTable.setModel(MatchcodesService.getOdataModel());
                //                 let tableCols = AppJsonModel.getProperty("/Equipment");
                //                 let currentJsonModel = new JSONModel({
                //                     "cols": tableCols
                //                 })

                //                 oTable.setModel(currentJsonModel, "columns");

                //                 if (oTable.bindRows) {
                //                     oTable.bindAggregation("rows", {
                //                         path: `${equipmentPath.path}`,
                //                         showHeader: false
                //                     });
                //                 }
                //                 oFragment.update();
                //             });
                //             oFragment.open();
                //         })
                //     } else if (response.length > 0) {
                //         this.getFragment(`EquipmentHelpDialog`).then(oFragment => {
                //             oFragment.getTableAsync().then(function (oTable) {
                //                 oTable.setModel(MatchcodesService.getOdataModel());
                //                 let tableCols = AppJsonModel.getProperty("/Equipment");
                //                 let currentJsonModel = new JSONModel({
                //                     "cols": tableCols
                //                 })

                //                 oTable.setModel(currentJsonModel, "columns");

                //                 if (oTable.bindRows) {
                //                     oTable.bindAggregation("rows", {
                //                         path: `${equipmentPath.path}`,
                //                         filters: oFilters,
                //                         showHeader: false
                //                     });
                //                 }
                //                 oFragment.update();
                //             });
                //             oFragment.open();
                //         })
                //     }
                // })
            },

            onExitDialog: function () {
                this.getFragment(`${inputId}HelpDialog`).then(function (oFragment) {
                    oFragment.exit();
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
                    } else {
                        AppJsonModel.setInnerProperty('/Editable', "ValueHelpSerialNumber", true);
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
                    this.checkEquipment();

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
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const statusFilterValue = oResourceBundle.getText('statusFilterValue');
                const deleteFlagValue = oResourceBundle.getText('deleteFlagValue');

                let aSelectionSet = oEvent.getParameter("selectionSet");
                let releaseDate = new Date(aSelectionSet[2]?.getValue());
                let releaseDateTo = new Date(aSelectionSet[3]?.getValue());

                if (!releaseDateTo.getDate()) {
                    releaseDateTo = releaseDate;
                }

                let aFilters = this.setProdOrderFilters(aSelectionSet, releaseDate, releaseDateTo);

                this.getFragment(`${inputId}HelpDialog`).then(oFragment => {
                    let oBinding = oFragment.getTable().getBinding("rows");

                    if (inputId === 'ElementCode' || inputId === 'DefectCode' || inputId === 'CauseCodeGruppe' || inputId === 'CauseCode') {
                        if (!aFilters.length) return

                        let prevFilters = oBinding.aApplicationFilters;
                        oBinding.aApplicationFilters = [];


                        let oFilters = new Filter({ filters: [...prevFilters[0], ...aFilters], and: true }); // false

                        oBinding.filter(oFilters);
                        oFragment.update();
                        oBinding.aApplicationFilters = prevFilters;
                        return;
                    }

                    if (inputId === 'ProductionOrder' && aFilters.length > 0) {
                        let aContext = oBinding.getContexts(0, Infinity); // Obtiene todos los contextos cargados
                        let aData = aContext.map(oContext => oContext.getObject());

                        if (aFilters._excludeDelFlag) {
                            let cleanValue = statusFilterValue.replace(/^\*+|\*+$/g, "");
                            cleanValue.toUpperCase();
                            aData = aData.filter(item => (!item.Status.includes(deleteFlagValue) && item.Status.includes(cleanValue)));
                        }

                        // Guardamos una copia en JSONModel
                        let oLocalModel = new JSONModel(aData);
                        oFragment.setModel(oLocalModel, "localModel");

                        // let aData = oLocalModel.getData();
                        // let aFiltered = aData.filter(item => {
                        //     return aFilters.every(oFilter => {
                        //         let operator = oFilter.sOperator || 'Contains';

                        //         let value1; 
                        //         let value2;
                        //         if (operator === 'BT') {;
                        //             value1 = oFilter.oValue1;
                        //             value2 = oFilter.oValue2;
                        //         }

                        //         let path = oFilter.sPath;
                        //         let value = oFilter.oValue1 ?? '';
                        //         let itemValue = (item[path] ?? "").toString().toLowerCase();

                        //         switch (operator) {
                        //             case 'EQ':
                        //                 return itemValue === value;
                        //             case 'Contains':
                        //                 return itemValue.includes(value);
                        //             case 'StartsWith':
                        //                 return itemValue.startsWith(value);
                        //             case 'EndsWith':
                        //                 return itemValue.endsWith(value);
                        //             case 'BT':
                        //                 return value1;
                        //             default:
                        //                 return itemValue.includes(value);
                        //         }
                        //     })
                        // })

                        let aFiltered = aData.filter(item => {
                            return aFilters.every(oFilter => {
                                let operator = oFilter.sOperator || 'Contains';
                                let path = oFilter.sPath;
                                let itemValue = item[path];

                                let value1 = oFilter.oValue1 ?? "";
                                let value2 = oFilter.oValue2 ?? "";

                                // Si es fecha, convertimos a Date (y comparamos)
                                const isDateFilter = itemValue instanceof Date || !isNaN(Date.parse(itemValue));

                                if (isDateFilter) {
                                    let itemDate = new Date(itemValue);
                                    let date1 = new Date(value1);
                                    // date1.setDate(date1.getDate() + 1);
                                    let date2 = new Date(value2);
                                    // date2 ? date2.setDate(date2.getDate() + 1) : ''

                                    if (!value2 || isNaN(date2)) {
                                        // Solo una fecha: comparación exacta o según operador
                                        switch (operator) {
                                            case 'EQ':
                                            case 'BT': // si el filtro es BT pero sólo hay 1 fecha, tomar como EQ
                                                return itemDate.toDateString() === date1.toDateString();
                                            case 'GT':
                                                return itemDate > date1;
                                            case 'LT':
                                                return itemDate < date1;
                                            default:
                                                return true;
                                        }
                                    } else {
                                        // Dos fechas válidas: rango BT
                                        if (operator === 'BT') {
                                            return itemDate >= date1 && itemDate <= date2;
                                        } else {
                                            // Otros operadores podrían respetarse igual, o fallback
                                            return true;
                                        }
                                    }

                                }
                                else {
                                    let strValue = (itemValue ?? "").toString().toLowerCase();
                                    let filterValue = (value1 ?? "").toString().toLowerCase();
                                    let filterValues = filterValue.split(/[\s\*]+/).filter(v => v); // separa por espacios y elimina vacíos

                                    switch (operator) {
                                        case 'EQ':
                                            return filterValues.some(val => strValue === val);
                                        case 'Contains':
                                            return filterValues.every(val => strValue.includes(val));
                                        case 'StartsWith':
                                            return filterValues.some(val => strValue.startsWith(val));
                                        case 'EndsWith':
                                            return filterValues.some(val => strValue.endsWith(val));
                                        case 'BT':
                                            return strValue >= value1 && strValue <= value2; // solo útil si no es fecha
                                        default:
                                            return filterValues.some(val => val.includes(val));
                                    }
                                }
                            });
                        });

                        // 4. Sobrescribís los datos en el modelo temporal (sin afectar el backend)
                        oLocalModel.setData(aFiltered);

                        // 5. Re-bind temporalmente los datos en la tabla
                        let oTable = oFragment.getTable();
                        oTable.setModel(oLocalModel);
                        oTable.bindRows("/"); // tabla tipo `sap.ui.table.Table`

                        oFragment.update();
                        return;
                    }

                    if (inputId === 'ProductionOrder' && aFilters.length === 0) {
                        let oModelProdOrder = MatchcodesService.getOdataModel();
                        let oFilters = this.getCurrentFilter(inputId);
                        let oTable = oFragment.getTable();
                        oTable.setBusy(true);

                        oModelProdOrder.read('/MatchCodeProductionOrder', {
                            urlParameters: { "$top": 2000 },
                            filters: [oFilters],

                            success: (oData) => {
                                let aData = oData.results;
                                let originalData = JSON.parse(JSON.stringify(aData));

                                originalData.forEach(item => {
                                    if (item.ReleaseDate) {
                                        item.ReleaseDate = formatter.formatDate(item.ReleaseDate);
                                    }
                                });

                                let oJSONModel = new JSONModel(originalData);
                                let tableCols = AppJsonModel.getProperty(`/${inputId}`);

                                tableCols.forEach(col => {
                                    let sPath = col.template;
                                    let oTextView = new sap.ui.commons.TextView({
                                        text: `{${sPath}}`
                                    });

                                    let oColumn = new sap.ui.table.Column({
                                        label: new sap.ui.commons.Label({ text: col.label }),
                                        template: oTextView,
                                        width: col.width
                                    });

                                    oTable.addColumn(oColumn);
                                });

                                let currentJsonModel = new JSONModel({
                                    "cols": tableCols
                                })

                                oTable.setModel(currentJsonModel, "columns");
                                oTable.setModel(oJSONModel);
                                oTable.bindRows("/");
                                oFragment.update();
                                oTable.setBusy(false);
                                return;
                            },
                            error: oError => {
                                console.log(oError);
                                oTable.setBusy(false);
                            }
                        })
                    }

                    if (aFilters.length) {
                        let oBinding = oFragment.getTable().getBinding("rows");

                        let prevFilters = oBinding.aApplicationFilters || [];
                        let combinedFilters = [...prevFilters, ...aFilters];

                        let finalFilter = new Filter({
                            filters: aFilters,
                            and: false
                        });

                        oBinding.filter(finalFilter);
                        oFragment.update();
                        return;
                    }

                    oBinding.filter([]);
                    oFragment.update();
                })
            },

            setProdOrderFilters: function (fields, releaseDate, releaseDateTo) {
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const statusOptions = ['REL', 'LIB', 'LIB.'];

                const statusFilterValue = oResourceBundle.getText('statusFilterValue');


                let filters = fields.reduce((aResult, oControl) => {
                    if (oControl.getName() === 'ReleaseDate' && oControl.getValue()) {
                        aResult.push(new Filter(oControl.getName(), FilterOperator.BT, releaseDate, releaseDateTo));
                        return aResult;
                    }

                    if (oControl.getName() === 'Status' && oControl.getValue()) {
                        let cleanOcontrolValue = oControl.getValue().replace(/^\*+|\*+$/g, "");

                        let oFilter = new Filter(oControl.getName(), FilterOperator.Contains, cleanOcontrolValue)
                        aResult.push(oFilter);

                        // 👉 Flag especial para tu lógica en onFilterBarSearch
                        // if (oControl.getValue() === statusFilterValue) {
                        //     aResult._excludeDelFlag = true;
                        // }

                        for (let stOpt of statusOptions) {
                            if (stOpt === cleanOcontrolValue.toUpperCase()) {
                                aResult._excludeDelFlag = true;
                            }
                        }
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

            onValueHelpClose: async function () {
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');

                if (inputId === 'ProductionOrder') {
                    // prodOrderPlan.setValue('');
                }

                if (inputId === 'WorkCenter' || inputId === 'Plant') {
                    this.saveDefaultValue();
                    this.autocompleteCodesInputs(inputId);
                }

                if ((inputId === 'ProductionOrder' || inputId === 'ProductOrderOperation') && defectInfo.ProductionOrder && defectInfo.ProductOrderOperation) {
                    this.getBoomMaterials();
                }

                if (inputId === 'ProductOrderOperation') {
                    try {
                        const elementCodeFilters = this.setCodesFilters('ElementCode');
                        const elementCodeResponse = await MatchcodesService.callGetService('/MatchCodeElementCode', elementCodeFilters);

                        let elementCodeResults = elementCodeResponse.results;
                        if (elementCodeResults.length === 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', elementCodeResults[0].ElementCode);
                            AppJsonModel.setInnerProperty('/Editable', 'ElementCode', false);

                            const defectCodeFilters = this.setCodesFilters('DefectCode');
                            const defectCodeResponse = await MatchcodesService.callGetService('/MatchCodeDefectCode', defectCodeFilters);

                            let defectCodeResults = defectCodeResponse.results;
                            if (defectCodeResults.length === 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', defectCodeResults[0].DefectCode);
                                AppJsonModel.setInnerProperty('/Editable', 'DefectCode', false);

                                const causeCodeGruppeFilters = this.setCodesFilters('CauseCodeGruppe');
                                const causeCodeGruppeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCodeGruppe', causeCodeGruppeFilters);

                                let causeCodeGruppeResults = causeCodeGruppeResponse.results;
                                if (causeCodeGruppeResults.length === 1) {
                                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', causeCodeGruppeResults[0].CauseCodeGruppe);
                                    AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', false);

                                    const causeCodeFilters = this.setCodesFilters('CauseCode');
                                    const causeCodeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);

                                    let causeCodeResults = causeCodeResponse.results;
                                    if (causeCodeResults.length === 1) {
                                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', causeCodeResults[0].CauseCode);
                                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                                    }
                                }
                            }

                            if (defectCodeResults.length === 0 || defectCodeResults.length > 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                            }
                        }

                        if (elementCodeResults.length === 0 || elementCodeResults.length > 1) {
                            this.cleanCodesInputs();
                        }
                    } catch (error) {
                        console.log(error);
                    }

                }

                if (inputId === 'ElementCode') {
                    this.autocompleteCodesInputs(inputId);
                }

                if (inputId === 'DefectCode' && defectInfo.ElementCode && defectInfo.DefectCode) {
                    this.autocompleteCodesInputs(inputId);
                }

                if (inputId === 'CauseCodeGruppe') {
                    this.autocompleteCodesInputs(inputId);
                }

                this.toggleSaveButton();
            },

            cleanCodesInputs: function () {
                // Element code
                AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', '');
                AppJsonModel.setInnerProperty('/Editable', 'ElementCode', true);
                // Defect code
                AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', '');
                AppJsonModel.setInnerProperty('/Editable', 'DefectCode', true);
                // Causecode gruppe
                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                // Causecode
                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
            },

            autocompleteCodesInputs: async function (id) {
                if (id === 'WorkCenter') {
                    const defectInfoData = AppJsonModel.getProperty('/DefectInfo');
                    const filters = [new Filter('Plant', FilterOperator.EQ, defectInfoData.Plant), new Filter('WorkCenter', FilterOperator.EQ, defectInfoData.WorkCenter)]

                    const productOrOperationResponse = await MatchcodesService.callGetService('/MatchCodeProductOrderOperation', filters);
                    let results = productOrOperationResponse.results;

                    if (results.length === 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'ProductOrderOperation', results[0].ProductOrderOperation);
                        AppJsonModel.setInnerProperty('/Editable', 'ProductOrderOperation', false);

                        const elementCodeFilters = this.setCodesFilters('ElementCode');
                        const elementCodeResponse = await MatchcodesService.callGetService('/MatchCodeElementCode', elementCodeFilters);

                        let elementCodeResults = elementCodeResponse.results;
                        if (elementCodeResults.length === 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', elementCodeResults[0].ElementCode);
                            AppJsonModel.setInnerProperty('/Editable', 'ElementCode', false);

                            const defectCodeFilters = this.setCodesFilters('DefectCode');
                            const defectCodeResponse = await MatchcodesService.callGetService('/MatchCodeDefectCode', defectCodeFilters);

                            let defectCodeResults = defectCodeResponse.results;
                            if (defectCodeResults.length === 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', defectCodeResults[0].DefectCode);
                                AppJsonModel.setInnerProperty('/Editable', 'DefectCode', false);

                                const causeCodeGruppeFilters = this.setCodesFilters('CauseCodeGruppe');
                                const causeCodeGruppeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCodeGruppe', causeCodeGruppeFilters);

                                let causeCodeGruppeResults = causeCodeGruppeResponse.results;
                                if (causeCodeGruppeResults.length === 1) {
                                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', causeCodeGruppeResults[0].CauseCodeGruppe);
                                    AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', false);

                                    const causeCodeFilters = this.setCodesFilters('CauseCode');
                                    const causeCodeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);

                                    let causeCodeResults = causeCodeResponse.results;
                                    if (causeCodeResults.length === 1) {
                                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', causeCodeResults[0].CauseCode);
                                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                                    }
                                }
                            }

                            if (defectCodeResults.length === 0 || defectCodeResults.length > 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                            }
                        }

                        if (elementCodeResults.length === 0 || elementCodeResults.length > 1) {
                            this.cleanCodesInputs()
                        }
                    }

                    if (results.length === 0 || results.length > 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'ProductOrderOperation', '')
                        AppJsonModel.setInnerProperty('/Editable', 'ProductOrderOperation', true)
                        this.cleanCodesInputs()
                    }
                }

                if (id === 'ElementCode') {
                    const defectCodeFilters = this.setCodesFilters('DefectCode');
                    const defectCodeResponse = await MatchcodesService.callGetService('/MatchCodeDefectCode', defectCodeFilters);

                    let defectCodeResults = defectCodeResponse.results;
                    if (defectCodeResults.length === 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', defectCodeResults[0].DefectCode);
                        AppJsonModel.setInnerProperty('/Editable', 'DefectCode', false);

                        let causeCodeGruppeFilters = this.setCodesFilters('CauseCodeGruppe');
                        let oDataCauseCodeGruppe = await MatchcodesService.callGetService('/MatchCodeCauseCodeGruppe', causeCodeGruppeFilters);

                        if (oDataCauseCodeGruppe.results.length === 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', oDataCauseCodeGruppe.results[0].CauseCodeGruppe);
                            AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', false);

                            let causeCodeFilters = this.setCodesFilters('CauseCode');
                            let oDataCause = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);

                            if (oDataCause.results.length === 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', oDataCause.results[0].CauseCode);
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                            }

                            if (oDataCause.results.length === 0 || oDataCause.results.length > 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                            }
                        }

                        if (oDataCauseCodeGruppe.length === 0 || oDataCauseCodeGruppe.length > 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                            AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                            AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                            AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                        }
                    }

                    if (defectCodeResults.length === 0 || defectCodeResults.length > 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', '');
                        AppJsonModel.setInnerProperty('/Editable', 'DefectCode', true);
                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                    }
                }

                if (id === 'DefectCode') {
                    let causeCodeGruppeFilters = this.setCodesFilters('CauseCodeGruppe');
                    let oDataCauseCodeGruppe = await MatchcodesService.callGetService('/MatchCodeCauseCodeGruppe', causeCodeGruppeFilters);
                    let causeCodeGruppeResults = oDataCauseCodeGruppe.results;

                    if (causeCodeGruppeResults.length === 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', causeCodeGruppeResults[0].CauseCodeGruppe);
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', false);

                        let causeCodeFilters = this.setCodesFilters('CauseCode');
                        let oDataCause = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);
                        let causeCodeResults = oDataCause.results;

                        if (causeCodeResults.length === 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', causeCodeResults[0].CauseCode);
                            AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                        }

                        if (causeCodeResults.length === 0 || causeCodeResults.length > 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                            AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                        }
                    }

                    if (oDataCauseCodeGruppe.results.length > 1) {
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                    }
                }

                if (id === 'CauseCodeGruppe') {
                    let causeCodeFilters = this.setCodesFilters('CauseCode');
                    let oDataCause = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);

                    if (oDataCause.results.length === 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', oDataCause.results[0].CauseCode);
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                    }

                    if (oDataCause.results.length === 0 || oDataCause.results.length > 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', '');
                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                    }
                }
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
                    let oBinding = oFragment.getTable().getBinding("rows");

                    if (inputId === 'ElementCode' || inputId === 'DefectCode' || inputId === 'CauseCodeGruppe' || inputId === 'CauseCode') {
                        // Guardamos los filtros previos
                        let prevFilters = oBinding.aApplicationFilters;
                        // Limpiamos los filtros para actualizarlos
                        oBinding.aApplicationFilters = [];

                        // Actualizamos filtros con los previos + los nuevos
                        if (aFilters.length) {
                            let oFilters = new Filter({
                                filters: [...prevFilters, ...aFilters],
                                and: true // false
                            });

                            oBinding.filter(oFilters);
                            oFragment.update();
                            // Volvemos a setear los filtros iniciales para no perderlos
                            oBinding.aApplicationFilters = prevFilters;
                            return;
                        }
                    }

                    if (aFilters.length) {
                        let oBinding = oFragment.getTable().getBinding("rows");

                        let prevFilters = oBinding.aApplicationFilters || [];
                        let combinedFilters = [...prevFilters, ...aFilters];

                        let finalFilter = new Filter({
                            filters: combinedFilters,
                            and: true
                        });

                        oBinding.filter(finalFilter);
                        oFragment.update();
                        return;
                    }

                    oBinding.filter([]);
                    oFragment.update();
                })
            },

            onSubmitQuantity: function () {
                this.getBoomMaterials();
            },

            getBoomMaterials: function () {
                const that = this;
                const oModel = this.getOwnerComponent().getModel();
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
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

                let aFilters = [
                    new Filter("ProdOrder", FilterOperator.EQ, currentProdOrder),
                    new Filter('ProdOrderOpPlan', FilterOperator.EQ, currentProdOrderPlan),
                    new Filter("WorkCtr", FilterOperator.EQ, currentWorkCenter),
                    new Filter("ComplainQty", FilterOperator.EQ, currentQuantity)
                ];

                bomTable.setBusy(true);
                // oModel.read("/ZfmGetBomSet", {
                //     filters: aFilters,
                //     success: function (data) {
                //         let boomDataValues = [];
                //         materialFilters = [];
                //         batchFilters = [];
                //         boomForSave = [];

                //         if (data.results.length === 0) {
                //             jsonModel.setData(boomDataValues);
                //             saveBtn.setEnabled(false);
                //             sap.m.MessageBox.show(`No hay materiales asociados a la orden ${currentProdOrder}`)
                //             return;
                //         }

                //         let objNames = Object.keys(data.results[0]);

                //         for (let i = 0; i < data.results.length; i++) {
                //             let objValues = {
                //                 CompUnit: data.results[i][objNames[1]],
                //                 ProdOrder: data.results[i][objNames[2]],
                //                 WorkCtr: data.results[i][objNames[3]],
                //                 ComplainQty: data.results[i][objNames[4]],
                //                 ProdOrderOpPlan: data.results[i][objNames[5]],
                //                 ReturnLog: data.results[i][objNames[6]],
                //                 ItemNo: data.results[i][objNames[7]],
                //                 Component: data.results[i][objNames[8]],
                //                 CompQty: data.results[i][objNames[9]],
                //                 Charg: data.results[i][objNames[10]],
                //                 Licha: data.results[i][objNames[11]],
                //                 IssueLoc: data.results[i][objNames[12]],
                //                 BinEwm: data.results[i][objNames[13]],
                //                 WhEwm: data.results[i][objNames[14]],
                //                 Message: data.results[i][objNames[15]],
                //             }

                //             materialFilters.push(data.results[i][objNames[5]]);
                //             batchFilters.push(data.results[i][objNames[10]]);

                //             if (objValues.ReturnLog) {
                //                 // sap.m.MessageBox.error(`${objValues.ReturnLog}`);
                //                 bomTable.setNoDataText(returnLogMsg);
                //                 jsonModel.setData(boomDataValues);
                //                 bomTable.setBusy(false);
                //                 that.clearNotifications();
                //                 return;
                //             }

                //             if (!objValues.ReturnLog && !objValues.Message) {
                //                 // saveBtn.setEnabled(true);
                //             } else if (!objValues.ReturnLog && objValues.Message && that.getChechStatus()) {
                //                 saveBtn.setEnabled(false);
                //             }

                //             boomForSave.push(objValues);
                //             boomDataValues.push(objValues);
                //         }

                //         let noStockMsg = boomDataValues.filter(boom => boom.Message);

                //         // noStockMsg.length > 0 ? saveBtn.setEnabled(false) : saveBtn.setEnabled(true);
                //         jsonModel.setData(boomDataValues);
                //         bomTable.setBusy(false);
                //         that.toggleSaveButton();
                //     },
                //     error: function (error) {
                //         MessageToast.show("Error al obtener los materiales del B.O.M");
                //         bomTable.setBusy(false);
                //     }
                // })

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
                            sap.m.MessageBox.show(`No hay materiales asociados a la orden ${currentProdOrder}`);
                            return;
                        }

                        let objNames = Object.keys(data.results[0]);

                        // Mapa para agrupar por componente
                        let componentMap = new Map();

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
                                Clabs: data.results[i][objNames[16]],
                            };

                            materialFilters.push(data.results[i][objNames[5]]);
                            batchFilters.push(data.results[i][objNames[10]]);

                            if (objValues.ReturnLog) {
                                bomTable.setNoDataText(returnLogMsg);
                                jsonModel.setData(boomDataValues);
                                bomTable.setBusy(false);
                                that.clearNotifications();
                                return;
                            }

                            // Agrupar por componente
                            let componentKey = objValues.Component;

                            if (componentMap.has(componentKey)) {
                                // Si ya existe el componente, agregar el Charg a la lista
                                let existingComponent = componentMap.get(componentKey);

                                // Agregar el nuevo Charg si no existe ya
                                if (!existingComponent.ChargList.some(c => c.Charg === objValues.Charg)) {
                                    existingComponent.ChargList.push({
                                        // Charg: objValues.Charg,
                                        // Licha: objValues.Licha,
                                        // BinEwm: objValues.BinEwm,
                                        // WhEwm: objValues.WhEwm,
                                        // Message: objValues.Message,
                                        // CompQty: objValues.CompQty,
                                        // Clabs: objValues.Clabs,
                                        ItemNo: objValues.ItemNo,
                                        Component: objValues.Component,
                                        CompQty: objValues.CompQty,
                                        Clabs: objValues.Clabs,
                                        Charg: objValues.Charg,
                                        Licha: objValues.Licha,
                                        IssueLoc: objValues.IssueLoc,
                                        Message: objValues.Message,
                                        ChangeNo: objValues.ProdOrderOpPlan,
                                        CompUnit: objValues.CompUnit,
                                        BinEwm: objValues.BinEwm,
                                        WhEwm: objValues.WhEwm,


                                    });
                                }

                                // Actualizar el Charg seleccionado (por defecto el primero o el que tenga stock)
                                if (!existingComponent.Message && objValues.Message) {
                                    // Mantener el que no tiene mensaje de error
                                } else if (!objValues.Message) {
                                    {
                                        existingComponent.ItemNo = objValues.ItemNo;
                                        existingComponent.Component = objValues.Component;
                                        existingComponent.CompQty = objValues.CompQty;
                                        existingComponent.Clabs = objValues.Clabs;
                                        existingComponent.Charg = objValues.Charg;
                                        existingComponent.Licha = objValues.Licha;
                                        existingComponent.IssueLoc = objValues.IssueLoc;
                                        existingComponent.Message = objValues.Message;
                                        existingComponent.ChangeNo = objValues.ProdOrderOpPlan;
                                        existingComponent.CompUnit = objValues.CompUnit;
                                        existingComponent.BinEwm = objValues.BinEwm;
                                        existingComponent.WhEwm = objValues.WhEwm;
                                    }

                                }
                            } else {
                                // Si es nuevo, crear el objeto con la lista de Charg
                                objValues.ChargList = [{
                                    ItemNo: objValues.ItemNo,
                                    Component: objValues.Component,
                                    CompQty: objValues.CompQty,
                                    Clabs: objValues.Clabs,
                                    Charg: objValues.Charg,
                                    Licha: objValues.Licha,
                                    IssueLoc: objValues.IssueLoc,
                                    Message: objValues.Message,
                                    ChangeNo: objValues.ProdOrderOpPlan,
                                    CompUnit: objValues.CompUnit,
                                    BinEwm: objValues.BinEwm,
                                    WhEwm: objValues.WhEwm,

                                }];
                                objValues.SelectedCharg = objValues.Charg; // Charg seleccionado por defecto
                                componentMap.set(componentKey, objValues);
                            }

                            // Validar botón de guardado
                            if (!objValues.ReturnLog && !objValues.Message) {
                                // saveBtn.setEnabled(true);
                            } else if (!objValues.ReturnLog && objValues.Message && that.getChechStatus()) {
                                saveBtn.setEnabled(false);
                            }
                        }

                        // Convertir el Map a array
                        boomDataValues = Array.from(componentMap.values());
                        let noStockMsg = boomDataValues.filter(boom => boom.Message);

                        boomForSave.push(boomDataValues);
                        jsonModel.setData(boomDataValues);
                        bomTable.setBusy(false);
                        that.toggleSaveButton();
                        that._afterBoomDataLoaded()
                    },
                    error: function (error) {
                        MessageToast.show("Error al obtener los materiales del B.O.M");
                        bomTable.setBusy(false);
                    }
                });
            },

            // onChargListMultiComboBoxSelectionChange: function(oEvent) {
            //     const selectedChargs = oEvent.getSource().getSelectedItems();
            //     if(selectedChargs.length === 0) return;

            //     const chargQtys = selectedChargs.map(item => {
            //         const currStrVal = item.getAdditionalText();
            //         let intQty = parseFloat(currStrVal.replace(',', '.'));
            //         return intQty;
            //     });

            //     let chargSum = 0;
            //     chargQtys.forEach(qty => chargSum += qty);

            //     if(chargSum === 0) return;

            //     MessageToast.show(`Cantidad total seleccionada: ${chargSum.toFixed(3)}`);
            //     console.log(chargSum.toFixed(3));
            // },

            // _applyChargListLogic: function (oMultiComboBox, oBindingContext) {
            //     const oModel = this.getView().getModel("boomData");
            //     const sPath = oBindingContext.getPath() + "/ChargList";
            //     const aChargList = oModel.getProperty(sPath);
            //     const selectedKeys = oMultiComboBox.getSelectedKeys() || [];
            //     const requiredQuantity = parseFloat(oBindingContext.getProperty("CompQty"));

            //     // Función auxiliar para parsear números
            //     const parseFormattedNumber = (str) => {
            //         if (typeof str === 'number') return str;
            //         return parseFloat(str.replace(/\./g, '').replace(',', '.'));
            //     };

            //     // Función auxiliar para formatear números
            //     const formatNumber = (num) => {
            //         return num.toFixed(3).replace('.', ',');
            //     };

            //     // Si no hay lotes seleccionados, no hacer nada
            //     if (selectedKeys.length === 0) return;

            //     // Guardar las cantidades originales si no existen
            //     aChargList.forEach(charge => {
            //         if (charge.OriginalClabs === undefined) {
            //             charge.OriginalClabs = charge.Clabs;
            //         }
            //         if (charge.Enabled === undefined) {
            //             charge.Enabled = true;
            //         }
            //     });

            //     // Calcular la suma de los items seleccionados
            //     let accumulatedSum = 0;
            //     selectedKeys.forEach(key => {
            //         const charge = aChargList.find(c => c.Charg === key);
            //         if (charge) {
            //             const currentQty = parseFormattedNumber(charge.Clabs);
            //             accumulatedSum += currentQty;
            //         }
            //     });

            //     // Calcular la cantidad restante
            //     const remainingQuantity = requiredQuantity - accumulatedSum;

            //     // Actualizar cantidades según la lógica
            //     aChargList.forEach(charge => {
            //         const isSelected = selectedKeys.includes(charge.Charg);
            //         const originalQty = parseFormattedNumber(charge.OriginalClabs);

            //         if (isSelected) {
            //             charge.Enabled = true;
            //         } else {
            //             if (remainingQuantity <= 0) {
            //                 charge.Clabs = "0,000";
            //                 charge.Enabled = false;
            //             } else {
            //                 if (originalQty <= remainingQuantity) {
            //                     charge.Clabs = charge.OriginalClabs;
            //                 } else {
            //                     charge.Clabs = formatNumber(remainingQuantity);
            //                 }
            //                 charge.Enabled = true;
            //             }
            //         }
            //     });

            //     // Actualizar el modelo
            //     oModel.setProperty(sPath, aChargList);
            // },

            _applyChargListLogic: function (oMultiComboBox, oBindingContext) {
                const oModel = this.getView().getModel("boomData");
                const sPath = oBindingContext.getPath() + "/ChargList";
                const aChargList = oModel.getProperty(sPath);
                const selectedKeys = oMultiComboBox.getSelectedKeys() || [];
                // Función auxiliar para parsear números
                const parseFormattedNumber = (str) => {
                    if (typeof str === 'number') return str;
                    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
                };

                const requiredQuantity = parseFormattedNumber(oBindingContext.getProperty("CompQty"));


                // Función auxiliar para formatear números
                const formatNumber = (num) => {
                    return num.toFixed(3).replace('.', ',');
                };

                // Guardar las cantidades originales si no existen
                aChargList.forEach(charge => {
                    if (charge.OriginalClabs === undefined) {
                        charge.OriginalClabs = charge.Clabs;
                    }
                    if (charge.Enabled === undefined) {
                        charge.Enabled = true;
                    }
                });

                // PASO 1: Ajustar las cantidades de todos los lotes según lo que va faltando
                let tempSum = 0;
                for (let i = 0; i < aChargList.length; i++) {
                    const charge = aChargList[i];
                    const originalQty = parseFormattedNumber(charge.OriginalClabs);
                    const remaining = requiredQuantity - tempSum;

                    if (remaining > 0) {
                        if (originalQty >= remaining) {
                            // Este lote tiene suficiente, ajustar a lo que falta
                            charge.Clabs = formatNumber(remaining);
                        } else {
                            // Este lote no es suficiente, mantener cantidad original
                            charge.Clabs = charge.OriginalClabs;
                        }
                        tempSum += parseFormattedNumber(charge.Clabs);
                    } else {
                        // Ya no se necesita más cantidad
                        charge.Clabs = "0,000";
                    }
                }

                // PASO 2: Seleccionar automáticamente los lotes necesarios
                let accumulatedSum = 0;
                let newSelectedKeys = [];

                for (let i = 0; i < aChargList.length; i++) {
                    const charge = aChargList[i];
                    const currentQty = parseFormattedNumber(charge.Clabs);

                    if (currentQty > 0 && accumulatedSum < requiredQuantity) {
                        newSelectedKeys.push(charge.Charg);
                        accumulatedSum += currentQty;

                        if (accumulatedSum >= requiredQuantity) {
                            break;
                        }
                    }
                }

                // Actualizar las keys seleccionadas en el MultiComboBox
                oMultiComboBox.setSelectedKeys(newSelectedKeys);

                // PASO 3: Actualizar estado de enabled según selección
                aChargList.forEach(charge => {
                    const isSelected = newSelectedKeys.includes(charge.Charg);
                    charge.Enabled = isSelected;
                });

                // Actualizar el modelo
                oModel.setProperty(sPath, aChargList);
            },

            _afterBoomDataLoaded: function () {
                const oTable = this.byId("bomTable");
                const aItems = oTable.getItems();

                // aItems.forEach(oItem => {
                //     const oMultiComboBox = oItem.getCells().find(cell =>
                //         cell.getMetadata().getName() === "sap.m.MultiComboBox"
                //     );

                //     if (oMultiComboBox) {
                //         const oBindingContext = oMultiComboBox.getBindingContext("boomData");
                //         if (oBindingContext) {
                //             this._applyChargListLogic(oMultiComboBox, oBindingContext);
                //         }
                //     }
                // });

                aItems.forEach(oItem => {
                    const aCells = oItem.getCells();
                    aCells.forEach(oCell => {
                        // Buscar el FlexBox que contiene el MultiComboBox
                        if (oCell.getMetadata().getName() === "sap.m.FlexBox") {
                            const aFlexBoxItems = oCell.getItems();
                            aFlexBoxItems.forEach(oFlexItem => {
                                if (oFlexItem.getMetadata().getName() === "sap.m.MultiComboBox") {
                                    const oBindingContext = oFlexItem.getBindingContext("boomData");
                                    if (oBindingContext) {
                                        // Aplicar la lógica automáticamente si hay lotes preseleccionados
                                        this._applyChargListLogic(oFlexItem, oBindingContext);
                                    }
                                }
                            });
                        }
                    });
                });

            },

            onChargListMultiComboBoxSelectionChange: function (oEvent) {
                const oMultiComboBox = oEvent.getSource();
                const selectedItems = oMultiComboBox.getSelectedItems();
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

                // Función auxiliar para parsear números con formato (1.000,000 o 1000,000)
                const parseFormattedNumber = (str) => {
                    if (typeof str === 'number') return str;
                    // Remover puntos de miles y reemplazar coma decimal por punto
                    return parseFloat(str.replace(/\./g, '').replace(',', '.'));
                };

                // Obtener el contexto de la fila para acceder a la cantidad requerida
                const oBindingContext = oMultiComboBox.getBindingContext("boomData");
                const requiredQuantity = parseFormattedNumber(oBindingContext.getProperty("CompQty"));

                // Obtener el modelo y el path de la lista de lotes
                const oModel = this.getView().getModel("boomData");
                const sPath = oBindingContext.getPath() + "/ChargList";
                const aChargList = oModel.getProperty(sPath);


                // Función auxiliar para formatear números (con coma como decimal)
                const formatNumber = (num) => {
                    return num.toFixed(3).replace('.', ',');
                };

                if (selectedItems.length === 0) {
                    // Si no hay selección, restaurar cantidades originales y habilitar todos
                    aChargList.forEach(charge => {
                        if (charge.OriginalClabs !== undefined) {
                            charge.Clabs = charge.OriginalClabs;
                        }
                        charge.Enabled = true;
                    });
                    oModel.setProperty(sPath, aChargList);
                    return;
                }

                // Guardar las cantidades originales si no existen
                aChargList.forEach(charge => {
                    if (charge.OriginalClabs === undefined) {
                        charge.OriginalClabs = charge.Clabs;
                    }
                    if (charge.Enabled === undefined) {
                        charge.Enabled = true;
                    }
                });

                // Obtener las claves seleccionadas
                const selectedKeys = selectedItems.map(item => item.getKey());

                // Calcular la suma de los items seleccionados usando la cantidad ACTUAL (Clabs), no la original
                let accumulatedSum = 0;
                selectedKeys.forEach(key => {
                    const charge = aChargList.find(c => c.Charg === key);
                    if (charge) {
                        // CAMBIO IMPORTANTE: Usar Clabs (cantidad actual) en lugar de OriginalClabs
                        const currentQty = parseFormattedNumber(charge.Clabs);
                        accumulatedSum += currentQty;
                    }
                });

                // Calcular la cantidad restante para alcanzar el requerido
                const remainingQuantity = requiredQuantity - accumulatedSum;

                // Actualizar cantidades según la lógica
                aChargList.forEach(charge => {
                    const isSelected = selectedKeys.includes(charge.Charg);
                    const originalQty = parseFormattedNumber(charge.OriginalClabs);

                    if (isSelected) {
                        // Los items seleccionados mantienen su cantidad ACTUAL (ya ajustada)
                        // No restaurar a OriginalClabs, mantener lo que ya tiene
                        charge.Enabled = true;
                    } else {
                        // Los items NO seleccionados
                        if (remainingQuantity <= 0) {
                            // Si ya se alcanzó o superó la cantidad requerida, se ponen a 0
                            charge.Clabs = "0,000";
                            charge.Enabled = false;
                        } else {
                            // Si aún falta cantidad
                            // Mantener la cantidad original si es menor o igual a lo que falta
                            if (originalQty <= remainingQuantity) {
                                charge.Clabs = charge.OriginalClabs;
                            } else {
                                // Si la cantidad original es mayor a lo que falta, mostrar lo que falta
                                charge.Clabs = formatNumber(remainingQuantity);
                            }
                            charge.Enabled = true;
                        }
                    }
                });

                // Actualizar el modelo
                oModel.setProperty(sPath, aChargList);

                // Mostrar toast con la suma actual
                let totalMessage;
                if (accumulatedSum >= requiredQuantity) {
                    totalMessage = oResourceBundle.getText("quantityCompleted", [formatNumber(accumulatedSum), formatNumber(requiredQuantity)]);
                    this.toggleSaveButton()
                } else {
                    totalMessage = oResourceBundle.getText("actualQuantity", [formatNumber(accumulatedSum), formatNumber(remainingQuantity)]);
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                }

                MessageToast.show(totalMessage);

                // Guardar las claves seleccionadas en el modelo
                oModel.setProperty(oBindingContext.getPath() + "/SelectedCharg", selectedKeys);
            },

            // Mostrar mensaje con,
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
                const that = this;
                const chargQuantityCorrect = this.checkChargsQuantity();
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();

                if (!chargQuantityCorrect) {
                    sap.m.MessageBox.error(oResourceBundle.getText("insufficientBatchQty"));
                    return;
                }

                let currBtnId = oEvent.getSource().getId().split('-').pop();
                let oModel = this.getOwnerComponent().getModel();
                let emptyFields = this.checkValueState();
                if (emptyFields) return;

                let sBusy = "Procesando...";
                let busyDialog4 = (sap.ui.getCore().byId("busy4")) ? sap.ui.getCore().byId("busy4") : new sap.m.BusyDialog('busy4', {
                    title: sBusy
                });

                let defectInfoValues = AppJsonModel.getProperty('/DefectInfo');
                let bomSet = boomForSave[0];
                let bomItemsSet = bomSet.flatMap(item => item.ChargList)
                    .filter(item => item.Clabs === '' || (item.Clabs !== '' && item.Enabled === true))


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
                    IvEmplCode: defectInfoValues.OperatorNumber,
                    EvAufnr: defectInfoValues.ProductionOrder,

                    BomItemSet: bomItemsSet.map((boomItem, index) => {
                        return {
                            ItemNo: boomItem.ItemNo,
                            Component: boomItem.Component,
                            CompQty: boomItem.Clabs ? boomItem.Clabs : boomItem.CompQty,
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

            checkChargsQuantity: function () {
                const oModel = this.getView().getModel("boomData");
                const multiBoxData = oModel.getData().map(item => item.ChargList).filter(list => list.length > 1);
                const selectedChargs = multiBoxData[0].filter(charg => charg.Enabled)
                const compQty = parseInt(selectedChargs[0].CompQty)

                let totalQty = 0;
                selectedChargs.forEach(charg => {
                    totalQty += parseFloat(charg.Clabs);
                });

                if (totalQty !== compQty) {
                    return false;
                }

                return true;
            },

            checkEquipment: function () {
                const equipmentInput = this.byId('Equipment');
                const currPlant = AppJsonModel.getProperty('/DefectInfo').Plant;
                const currWorkcenter = AppJsonModel.getProperty('/DefectInfo').WorkCenter;
                let oModel = MatchcodesService.getOdataModel();

                let oFilter = [new Filter('Plant', FilterOperator.EQ, currPlant), new Filter('WorkCenter', FilterOperator.EQ, currWorkcenter)];

                let equipments = AppJsonModel.getProperty('/Equipments');
                // MatchcodesService.callGetService('/MatchCodeEquipment', oFilter).then(data => {
                //     const response = data.results;

                //     if (response.length > 1) {

                //         equipments = [];
                //         response.forEach(eq => {
                //             equipments.push({
                //                 Description: `${eq.Description}`,
                //                 Equipment: `${eq.Equipment}`,
                //                 Plant: `${eq.Plant}`,
                //                 Sortfield: `${eq.Sortfield}`,
                //                 WorkCenter: `${eq.WorkCenter}`
                //             })
                //         })

                //         AppJsonModel.setProperty('/Equipments', equipments);
                //         equipmentInput.setValue('');
                //         equipmentInput.setEditable(true);
                //         equipmentInput.setShowValueHelp(true);
                //         return;
                //     }

                //     if (response.length === 1) {
                //         equipmentInput.setValue(response[0].Equipment);
                //         equipmentInput.setValueState('None');
                //         equipmentInput.setEditable(false);
                //         equipmentInput.setShowValueHelp(false);
                //         return;
                //     }

                //     if (response.length === 0) {
                //         // let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                //         // oFilter = [new Filter('Plant', FilterOperator.EQ, defectInfo.Plant), new Filter('WorkCenterL2', FilterOperator.EQ, defectInfo.WorkCenter)];

                //         MatchcodesService.callGetService('/MatchCodeEquipmentWrkCtr', [oFilter]).then(data => {
                //             const response = data.results;

                //             if (response.length === 0) {
                //                 AppJsonModel.setProperty('/Equipments', []);
                //                 equipmentInput.setValueState('None');
                //                 equipmentInput.setValue('');
                //                 equipmentInput.setEditable(true);
                //                 equipmentInput.setShowValueHelp(true);
                //                 return;
                //             }

                //             if (response.length === 1) {
                //                 equipmentInput.setValue(response[0].Equipment);
                //                 equipmentInput.setValueState('None');
                //                 equipmentInput.setEditable(false);
                //                 equipmentInput.setShowValueHelp(false);
                //                 return;
                //             }

                //             if (response.length > 1) {

                //                 equipments = [];
                //                 response.forEach(eq => {
                //                     equipments.push({
                //                         Description: `${eq.Description}`,
                //                         Equipment: `${eq.Equipment}`,
                //                         Plant: `${eq.Plant}`,
                //                         Sortfield: `${eq.Sortfield}`,
                //                         WorkCenter: `${eq.WorkCenter}`
                //                     })
                //                 })

                //                 AppJsonModel.setProperty('/Equipments', equipments);
                //                 equipmentInput.setValue('');
                //                 equipmentInput.setEditable(true);
                //                 equipmentInput.setShowValueHelp(true);
                //                 return;
                //             }
                //         })

                //     }
                // })

                oModel.read('/MatchCodeEquipment', {
                    urlParameters: { "$top": 5000 },
                    filters: [oFilter],
                    success: function (data) {
                        const response = data.results;

                        if (response.length > 1) {

                            equipments = [];
                            response.forEach(eq => {
                                equipments.push({
                                    Description: `${eq.Description}`,
                                    Equipment: `${eq.Equipment}`,
                                    Plant: `${eq.Plant}`,
                                    SortField: `${eq.SortField}`,
                                    WorkCenter: `${eq.WorkCenter}`
                                })
                            })

                            AppJsonModel.setProperty('/Equipments', equipments);
                            equipmentInput.setValue('');
                            equipmentInput.setEditable(true);
                            equipmentInput.setShowValueHelp(true);
                            return;
                        }

                        if (response.length === 1) {
                            equipmentInput.setValue(response[0].Equipment);
                            equipmentInput.setValueState('None');
                            equipmentInput.setEditable(false);
                            equipmentInput.setShowValueHelp(false);
                            return;
                        }

                        if (response.length === 0) {
                            // let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                            // oFilter = [new Filter('Plant', FilterOperator.EQ, defectInfo.Plant), new Filter('WorkCenterL2', FilterOperator.EQ, defectInfo.WorkCenter)];

                            MatchcodesService.callGetService('/MatchCodeEquipmentWrkCtr', [oFilter]).then(data => {
                                const response = data.results;

                                if (response.length === 0) {
                                    AppJsonModel.setProperty('/Equipments', []);
                                    equipmentInput.setValueState('None');
                                    equipmentInput.setValue('');
                                    equipmentInput.setEditable(true);
                                    equipmentInput.setShowValueHelp(true);
                                    return;
                                }

                                if (response.length === 1) {
                                    equipmentInput.setValue(response[0].Equipment);
                                    equipmentInput.setValueState('None');
                                    equipmentInput.setEditable(false);
                                    equipmentInput.setShowValueHelp(false);
                                    return;
                                }

                                if (response.length > 1) {

                                    equipments = [];
                                    response.forEach(eq => {
                                        equipments.push({
                                            Description: `${eq.Description}`,
                                            Equipment: `${eq.Equipment}`,
                                            Plant: `${eq.Plant}`,
                                            SortField: `${eq.SortField}`,
                                            WorkCenter: `${eq.WorkCenter}`
                                        })
                                    })

                                    AppJsonModel.setProperty('/Equipments', equipments);
                                    equipmentInput.setValue('');
                                    equipmentInput.setEditable(true);
                                    equipmentInput.setShowValueHelp(true);
                                    return;
                                }
                            })

                        }
                    },
                    error: (oError) => {
                        console.log(oError);
                    }
                })
            },

            checkProductOrderOperation: async function () {
                try {
                    const defectInfoData = AppJsonModel.getProperty('/DefectInfo');
                    const filters = [new Filter('Plant', FilterOperator.EQ, defectInfoData.Plant), new Filter('WorkCenter', FilterOperator.EQ, defectInfoData.WorkCenter)]

                    const productOrOperationResponse = await MatchcodesService.callGetService('/MatchCodeProductOrderOperation', filters);
                    let results = productOrOperationResponse.results;
                    // let testResult = results.splice(0, 1);

                    if (results.length === 1) {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'ProductOrderOperation', results[0].ProductOrderOperation);
                        AppJsonModel.setInnerProperty('/Editable', 'ProductOrderOperation', false);

                        const elementCodeFilters = this.setCodesFilters('ElementCode');
                        const elementCodeResponse = await MatchcodesService.callGetService('/MatchCodeElementCode', elementCodeFilters);

                        let elementCodeResults = elementCodeResponse.results;
                        if (elementCodeResults.length === 1) {
                            AppJsonModel.setInnerProperty('/DefectInfo', 'ElementCode', elementCodeResults[0].ElementCode);
                            AppJsonModel.setInnerProperty('/Editable', 'ElementCode', false);

                            const defectCodeFilters = this.setCodesFilters('DefectCode');
                            const defectCodeResponse = await MatchcodesService.callGetService('/MatchCodeDefectCode', defectCodeFilters);

                            let defectCodeResults = defectCodeResponse.results;
                            if (defectCodeResults.length === 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'DefectCode', defectCodeResults[0].DefectCode);
                                AppJsonModel.setInnerProperty('/Editable', 'DefectCode', false);

                                const causeCodeGruppeFilters = this.setCodesFilters('CauseCodeGruppe');
                                const causeCodeGruppeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCodeGruppe', causeCodeGruppeFilters);

                                let causeCodeGruppeResults = causeCodeGruppeResponse.results;
                                if (causeCodeGruppeResults.length === 1) {
                                    AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', causeCodeGruppeResults[0].CauseCodeGruppe);
                                    AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', false);

                                    const causeCodeFilters = this.setCodesFilters('CauseCode');
                                    const causeCodeResponse = await MatchcodesService.callGetService('/MatchCodeCauseCode', causeCodeFilters);

                                    let causeCodeResults = causeCodeResponse.results;
                                    if (causeCodeResults.length === 1) {
                                        AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCode', causeCodeResults[0].CauseCode);
                                        AppJsonModel.setInnerProperty('/Editable', 'CauseCode', false);
                                    }
                                }
                            }

                            if (defectCodeResults.length === 0 || defectCodeResults.length > 1) {
                                AppJsonModel.setInnerProperty('/DefectInfo', 'CauseCodeGruppe', '');
                                AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                            }
                        }

                        if (elementCodeResults.length === 0 || elementCodeResults.length > 1) {
                            this.cleanCodesInputs();
                        }
                    }

                } catch (error) {
                    console.log(error);
                }
            },
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
                    // AppJsonModel.setInnerProperty('/Editable', 'CauseCodeGruppe', true);
                    // AppJsonModel.setInnerProperty('/Editable', 'CauseCode', true);
                    bomModel.setData({});
                    bomTable.setNoDataText(noDataText);
                    this.clearNotifications();
                    return;
                }
                if (currId === 'SerialNumber' && !currValue) {
                    this.byId(currId).setValueState('None');
                    return;
                }
                if (currId === 'WorkCenter') {
                    this.byId(currId).setValue(oEvent.getParameter("value").toUpperCase());
                    this.byId(currId).setValueState("None");
                    // FUNCTION TO AUTOCOMPLETE EQUIPMENT
                    this.checkEquipment();
                    return;
                }
                if (currId === 'OperatorNumber') {
                    if (!currValue.trim()) {
                        this.byId(currId).setValueState("None");
                        this.byId(currId).setValueStateText('');
                        return
                    }

                    this.checkOperatorNumber(currValue);
                    return;
                }
                if (currValue) {
                    this.byId(currId).setValueState("None");
                }
            },

            // onQuantityInputLiveChange: function (oEvent) {

            //     const defectInfo = AppJsonModel.getProperty('/DefectInfo');
            //     const currValue = oEvent.getParameter('value');
            //     const bomModel = this.getOwnerComponent().getModel('boomData');
            //     // const bomTable = this.byId("bomTable");

            //     if (!currValue.trim()) {
            //         AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
            //         AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue)
            //         bomModel.getData().forEach(cell => cell.CompQty = '')
            //         bomModel.updateBindings()
            //         return;
            //     }

            //     if (currValue === '0') {
            //         AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
            //         AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue)
            //         this.getBoomMaterials();
            //         return;
            //     }

            //     if (defectInfo.ProductionOrder && defectInfo.ProductOrderOperation && currValue) {
            //         setTimeout(() => {
            //             AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue)
            //             // AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', true);
            //             this.getBoomMaterials();
            //             return;
            //         }, 300);
            //     }
            // },

            onQuantityInputLiveChange: function (oEvent) {
                const defectInfo = AppJsonModel.getProperty('/DefectInfo');
                const currValue = oEvent.getParameter('value');
                const bomModel = this.getOwnerComponent().getModel('boomData');

                // 1) Limpio timeout anterior si existe
                if (this._quantityDebounceTimer) {
                    clearTimeout(this._quantityDebounceTimer);
                    this._quantityDebounceTimer = null;
                }

                // 2) Casos inmediatos (no debounced)
                if (!currValue.trim()) {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue);
                    bomModel.getData().forEach(cell => cell.CompQty = '');
                    bomModel.updateBindings();
                    return;
                }

                if (currValue === '0') {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue);
                    this.getBoomMaterials(); // este sí querés que dispare instantáneo
                    return;
                }

                // 3) Lógica debounced
                if (defectInfo.ProductionOrder && defectInfo.ProductOrderOperation && currValue) {
                    this._quantityDebounceTimer = setTimeout(() => {
                        AppJsonModel.setInnerProperty('/DefectInfo', 'Quantity', currValue);
                        this.getBoomMaterials();
                    }, 700);
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
                let boomMessages = boomForSave.flatMap(item => item).filter(item => item.Message)

                if(boomMessages.length > 0) {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    return;
                }

                let stockChecked = this.getChechStatus();
                let defectInfo = AppJsonModel.getProperty('/DefectInfo');
                let defectInfoKeys = Object.keys(defectInfo);
                let filterInfo = defectInfoKeys.filter(item => item !== "UnitOfMeasure" && item !== "SerialNumber" && item !== "DefectCode");
                let equipmentStateError = this.byId('Equipment').getValueState();
                let opNumberStateError = this.byId('OperatorNumber').getValueState();
                let quantityInputValue = this.byId('Quantity').getValue();

                let emptyInputs = 0;
                for (let key of filterInfo) {
                    if (!defectInfo[key]) {
                        emptyInputs++;
                    }
                }

                if (boomMessages.length > 0) {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    return;
                }

                if (equipmentStateError === 'Error' || opNumberStateError === 'Error') {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    return;
                }

                if ((!emptyInputs && boomForSave.length === 0) || emptyInputs || quantityInputValue === '0') {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', false);
                    return;
                }

                if ((!emptyInputs && boomMessages.length === 0) || (!emptyInputs && boomMessages.length > 0 && equipmentStateError !== 'Error')) {
                    AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', true);
                    return;
                }

                // if (!emptyInputs && equipmentStateError !== 'Error') {
                //     AppJsonModel.setInnerProperty('/Enabled', 'SaveBtn', true)
                //     return;
                // }


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

            onOperatorNumber: function (oEvent) {
                const currentOpNumber = oEvent.getParameter('value').trim();
                if (!currentOpNumber) return;

                this.checkOperatorNumber(currentOpNumber);
            },

            checkOperatorNumber: function (opNumber) {
                const maxOpNumberLength = 30;
                const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
                const currentPlant = AppJsonModel.getProperty('/DefectInfo').Plant
                let aFilter;

                if (currentPlant === 'PT10') {
                    let combinedFilter = [new Filter('empl_code', FilterOperator.EQ, opNumber.padStart(maxOpNumberLength, '0')), new Filter('subty', FilterOperator.EQ, '0009'), new Filter('tipo', FilterOperator.EQ, 'U')];
                    aFilter = combinedFilter;
                } else {
                    aFilter = [new Filter('empl_code', FilterOperator.EQ, opNumber.padStart(maxOpNumberLength, '0')), new Filter('tipo', FilterOperator.EQ, 'P')];
                }

                MatchcodesService.callGetService('/CheckPernr', aFilter)
                    .then(operatorData => {
                        if (operatorData.results.length === 0) {
                            const noOpNumber = oResourceBundle.getText('noOperatorNumber', [opNumber]);
                            this.byId('OperatorNumber').setValueState('Error')
                            this.byId('OperatorNumber').setValueStateText(noOpNumber)
                            this.toggleSaveButton()
                            return;
                        }

                        this.byId('OperatorNumber').setValueState('None')
                        this.byId('OperatorNumber').setValueStateText('')
                        this.toggleSaveButton();
                        return;
                    })
            },

            handleMessagePopoverPress: function (oEvent) {
                oMessagePopover.toggle(oEvent.getSource());
            }
        });
    });
