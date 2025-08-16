import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'p_donation_widget.dart' show PDonationWidget;
import 'package:flutter/material.dart';

class PDonationModel extends FlutterFlowModel<PDonationWidget> {
  ///  State fields for stateful widgets in this page.

  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    cNavigationBarModel.dispose();
  }
}
