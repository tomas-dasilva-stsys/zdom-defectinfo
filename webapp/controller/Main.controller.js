sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/m/MessageBox",
	"sap/ui/core/UIComponent",
	"zdom/zdom/services/MatchcodesService",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (
	Controller,
	MessageBox,
	UIComponent,
	MatchcodesService,
	Filter,
	FilterOperator,
) {
	"use strict";

	return Controller.extend("zdom.zdom.controller.Main", {
		onLoginPress: function () {
			const oResourceBundle = this.getView().getModel("i18n").getResourceBundle();
			const loginValue = this.byId("userIdInput").getValue();
			const userNotFoundError = oResourceBundle.getText("textErrorUserNotFound")
			const wrongValueError = oResourceBundle.getText("textErrorWrongValue")
			const oRouter = UIComponent.getRouterFor(this);

			if (!loginValue.trim()) {
				MessageBox.error(wrongValueError);
				return;
			}

			const aFilter = [new Filter("bname", FilterOperator.EQ, loginValue)];

			MatchcodesService.callGetService('/UserData', aFilter).then(data => {
				if (data.results.length === 0) {
					MessageBox.error(userNotFoundError);
					return;
				}

				const {Plant, WorkCenter, bname} = data.results[0];
			}).catch(err => {
				console.log(err)
			})

			// oRouter.navTo("RouteDefectInfo", {
			// 	user: loginValue
			// })
		},

		onUserInputLiveChange: function (oEvent) {
			const userInput = this.byId("userIdInput");
			userInput.setValue(oEvent.getParameter("value").toUpperCase());
		}
	});
});