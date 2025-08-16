import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import 'c_class_settings_widget.dart' show CClassSettingsWidget;
import 'package:flutter/material.dart';

class CClassSettingsModel extends FlutterFlowModel<CClassSettingsWidget> {
  ///  State fields for stateful widgets in this component.

  // State field(s) for TextFieldComment widget.
  FocusNode? textFieldCommentFocusNode;
  TextEditingController? textFieldCommentTextController;
  String? Function(BuildContext, String?)?
      textFieldCommentTextControllerValidator;
  // State field(s) for ClassStatus widget.
  FormFieldController<List<String>>? classStatusValueController;
  String? get classStatusValue =>
      classStatusValueController?.value?.firstOrNull;
  set classStatusValue(String? val) =>
      classStatusValueController?.value = val != null ? [val] : [];
  // State field(s) for EnableSelfCheckIn widget.
  bool? enableSelfCheckInValue;
  // State field(s) for EnableRealtimeResults widget.
  bool? enableRealtimeResultsValue;
  // Stores action output result for [Backend Call - Update Row(s)] action in SaveButton widget.
  List<TblClassQueueRow>? apiResult57g;
  // Stores action output result for [Backend Call - Update Row(s)] action in SaveButton widget.
  List<TblClassQueueRow>? apiResultuws;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    textFieldCommentFocusNode?.dispose();
    textFieldCommentTextController?.dispose();
  }
}
