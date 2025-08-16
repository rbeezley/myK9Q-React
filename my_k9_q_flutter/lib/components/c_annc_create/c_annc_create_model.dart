import '/flutter_flow/flutter_flow_util.dart';
import 'c_annc_create_widget.dart' show CAnncCreateWidget;
import 'package:flutter/material.dart';

class CAnncCreateModel extends FlutterFlowModel<CAnncCreateWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for AnncCreateSubject widget.
  FocusNode? anncCreateSubjectFocusNode;
  TextEditingController? anncCreateSubjectTextController;
  String? Function(BuildContext, String?)?
      anncCreateSubjectTextControllerValidator;
  // State field(s) for AnncCreateBody widget.
  FocusNode? anncCreateBodyFocusNode;
  TextEditingController? anncCreateBodyTextController;
  String? Function(BuildContext, String?)?
      anncCreateBodyTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    anncCreateSubjectFocusNode?.dispose();
    anncCreateSubjectTextController?.dispose();

    anncCreateBodyFocusNode?.dispose();
    anncCreateBodyTextController?.dispose();
  }
}
