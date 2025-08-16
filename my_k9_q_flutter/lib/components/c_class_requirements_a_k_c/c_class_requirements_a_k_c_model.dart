import '/flutter_flow/flutter_flow_util.dart';
import 'c_class_requirements_a_k_c_widget.dart'
    show CClassRequirementsAKCWidget;
import 'package:flutter/material.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

class CClassRequirementsAKCModel
    extends FlutterFlowModel<CClassRequirementsAKCWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for TextFieldMaxTime1 widget.
  FocusNode? textFieldMaxTime1FocusNode;
  TextEditingController? textFieldMaxTime1TextController;
  late MaskTextInputFormatter textFieldMaxTime1Mask;
  String? Function(BuildContext, String?)?
      textFieldMaxTime1TextControllerValidator;
  // State field(s) for TextFieldMaxTime2 widget.
  FocusNode? textFieldMaxTime2FocusNode;
  TextEditingController? textFieldMaxTime2TextController;
  late MaskTextInputFormatter textFieldMaxTime2Mask;
  String? Function(BuildContext, String?)?
      textFieldMaxTime2TextControllerValidator;
  // State field(s) for TextFieldMaxTime3 widget.
  FocusNode? textFieldMaxTime3FocusNode;
  TextEditingController? textFieldMaxTime3TextController;
  late MaskTextInputFormatter textFieldMaxTime3Mask;
  String? Function(BuildContext, String?)?
      textFieldMaxTime3TextControllerValidator;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldMaxTime1FocusNode?.dispose();
    textFieldMaxTime1TextController?.dispose();

    textFieldMaxTime2FocusNode?.dispose();
    textFieldMaxTime2TextController?.dispose();

    textFieldMaxTime3FocusNode?.dispose();
    textFieldMaxTime3TextController?.dispose();
  }
}
