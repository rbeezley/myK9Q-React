import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'p_settings_widget.dart' show PSettingsWidget;
import 'package:expandable/expandable.dart';
import 'package:flutter/material.dart';

class PSettingsModel extends FlutterFlowModel<PSettingsWidget> {
  ///  State fields for stateful widgets in this page.

  // State field(s) for ExpandableLicense widget.
  late ExpandableController expandableLicenseExpandableController;

  // State field(s) for ExpandablePassCode widget.
  late ExpandableController expandablePassCodeExpandableController;

  // State field(s) for ExpandableQRCodes widget.
  late ExpandableController expandableQRCodesExpandableController;

  // State field(s) for ExpandableShowType widget.
  late ExpandableController expandableShowTypeExpandableController;

  // State field(s) for ExpandableHelp widget.
  late ExpandableController expandableHelpExpandableController;

  // State field(s) for ExpandableAbout widget.
  late ExpandableController expandableAboutExpandableController;

  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    expandableLicenseExpandableController.dispose();
    expandablePassCodeExpandableController.dispose();
    expandableQRCodesExpandableController.dispose();
    expandableShowTypeExpandableController.dispose();
    expandableHelpExpandableController.dispose();
    expandableAboutExpandableController.dispose();
    cNavigationBarModel.dispose();
  }
}
