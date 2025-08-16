import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import 'c_fast_cat_health_check_widget.dart' show CFastCatHealthCheckWidget;
import 'package:flutter/material.dart';

class CFastCatHealthCheckModel
    extends FlutterFlowModel<CFastCatHealthCheckWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for ChoiceChipsHealthCheck widget.
  FormFieldController<List<String>>? choiceChipsHealthCheckValueController;
  String? get choiceChipsHealthCheckValue =>
      choiceChipsHealthCheckValueController?.value?.firstOrNull;
  set choiceChipsHealthCheckValue(String? val) =>
      choiceChipsHealthCheckValueController?.value = val != null ? [val] : [];
  // State field(s) for TextFieldHealthCheckComment widget.
  FocusNode? textFieldHealthCheckCommentFocusNode;
  TextEditingController? textFieldHealthCheckCommentTextController;
  String? Function(BuildContext, String?)?
      textFieldHealthCheckCommentTextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldHealthCheckCommentFocusNode?.dispose();
    textFieldHealthCheckCommentTextController?.dispose();
  }
}
