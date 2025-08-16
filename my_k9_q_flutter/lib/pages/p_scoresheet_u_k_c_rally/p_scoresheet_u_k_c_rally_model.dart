import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'p_scoresheet_u_k_c_rally_widget.dart' show PScoresheetUKCRallyWidget;
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:flutter/material.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

class PScoresheetUKCRallyModel
    extends FlutterFlowModel<PScoresheetUKCRallyWidget> {
  ///  State fields for stateful widgets in this page.

  final formKey = GlobalKey<FormState>();
  // State field(s) for TimerRun widget.
  final timerRunInitialTimeMs = 0;
  int timerRunMilliseconds = 0;
  String timerRunValue = StopWatchTimer.getDisplayTime(
    0,
    hours: false,
  );
  FlutterFlowTimerController timerRunController =
      FlutterFlowTimerController(StopWatchTimer(mode: StopWatchMode.countUp));

  // State field(s) for TextFieldRunTime widget.
  FocusNode? textFieldRunTimeFocusNode;
  TextEditingController? textFieldRunTimeTextController;
  late MaskTextInputFormatter textFieldRunTimeMask;
  String? Function(BuildContext, String?)?
      textFieldRunTimeTextControllerValidator;
  // State field(s) for ChoiceChipsUKC widget.
  FormFieldController<List<String>>? choiceChipsUKCValueController;
  String? get choiceChipsUKCValue =>
      choiceChipsUKCValueController?.value?.firstOrNull;
  set choiceChipsUKCValue(String? val) =>
      choiceChipsUKCValueController?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChipsNQ widget.
  FormFieldController<List<String>>? choiceChipsNQValueController;
  String? get choiceChipsNQValue =>
      choiceChipsNQValueController?.value?.firstOrNull;
  set choiceChipsNQValue(String? val) =>
      choiceChipsNQValueController?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChipsEX widget.
  FormFieldController<List<String>>? choiceChipsEXValueController;
  String? get choiceChipsEXValue =>
      choiceChipsEXValueController?.value?.firstOrNull;
  set choiceChipsEXValue(String? val) =>
      choiceChipsEXValueController?.value = val != null ? [val] : [];
  // State field(s) for ChoiceChipsDQ widget.
  FormFieldController<List<String>>? choiceChipsDQValueController;
  String? get choiceChipsDQValue =>
      choiceChipsDQValueController?.value?.firstOrNull;
  set choiceChipsDQValue(String? val) =>
      choiceChipsDQValueController?.value = val != null ? [val] : [];
  // State field(s) for TextFieldScore widget.
  FocusNode? textFieldScoreFocusNode;
  TextEditingController? textFieldScoreTextController;
  String? Function(BuildContext, String?)?
      textFieldScoreTextControllerValidator;
  String? _textFieldScoreTextControllerValidator(
      BuildContext context, String? val) {
    if (val == null || val.isEmpty) {
      return 'Field is required';
    }

    if (val.length < 2) {
      return 'Requires at least 2 characters.';
    }
    if (val.length > 3) {
      return 'Maximum 3 characters allowed, currently ${val.length}.';
    }

    return null;
  }

  @override
  void initState(BuildContext context) {
    textFieldScoreTextControllerValidator =
        _textFieldScoreTextControllerValidator;
  }

  @override
  void dispose() {
    timerRunController.dispose();
    textFieldRunTimeFocusNode?.dispose();
    textFieldRunTimeTextController?.dispose();

    textFieldScoreFocusNode?.dispose();
    textFieldScoreTextController?.dispose();
  }
}
