import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'p_scoresheet_a_k_c_fast_cat_widget.dart'
    show PScoresheetAKCFastCatWidget;
import 'package:flutter/material.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

class PScoresheetAKCFastCatModel
    extends FlutterFlowModel<PScoresheetAKCFastCatWidget> {
  ///  State fields for stateful widgets in this page.

  // State field(s) for TextFieldRunTime widget.
  FocusNode? textFieldRunTimeFocusNode;
  TextEditingController? textFieldRunTimeTextController;
  late MaskTextInputFormatter textFieldRunTimeMask;
  String? Function(BuildContext, String?)?
      textFieldRunTimeTextControllerValidator;
  // State field(s) for ChoiceChipsAKC widget.
  FormFieldController<List<String>>? choiceChipsAKCValueController;
  String? get choiceChipsAKCValue =>
      choiceChipsAKCValueController?.value?.firstOrNull;
  set choiceChipsAKCValue(String? val) =>
      choiceChipsAKCValueController?.value = val != null ? [val] : [];

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldRunTimeFocusNode?.dispose();
    textFieldRunTimeTextController?.dispose();
  }
}
