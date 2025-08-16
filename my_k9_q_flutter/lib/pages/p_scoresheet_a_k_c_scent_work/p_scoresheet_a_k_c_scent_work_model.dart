import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/flutter_flow/instant_timer.dart';
import '/index.dart';
import 'p_scoresheet_a_k_c_scent_work_widget.dart'
    show PScoresheetAKCScentWorkWidget;
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';
import 'package:mask_text_input_formatter/mask_text_input_formatter.dart';

class PScoresheetAKCScentWorkModel
    extends FlutterFlowModel<PScoresheetAKCScentWorkWidget> {
  ///  Local state fields for this page.

  int pgMaxTimeMS = 0;

  ///  State fields for stateful widgets in this page.

  // State field(s) for TimerSearch widget.
  final timerSearchInitialTimeMs = 0;
  int timerSearchMilliseconds = 0;
  String timerSearchValue = StopWatchTimer.getDisplayTime(
    0,
    hours: false,
  );
  FlutterFlowTimerController timerSearchController =
      FlutterFlowTimerController(StopWatchTimer(mode: StopWatchMode.countUp));

  // State field(s) for TimerMaxTime widget.
  final timerMaxTimeInitialTimeMs = 0;
  int timerMaxTimeMilliseconds = 0;
  String timerMaxTimeValue = StopWatchTimer.getDisplayTime(
    0,
    hours: false,
    milliSecond: false,
  );
  FlutterFlowTimerController timerMaxTimeController =
      FlutterFlowTimerController(StopWatchTimer(mode: StopWatchMode.countDown));

  InstantTimer? instantTimer;
  AudioPlayer? soundPlayer;
  // State field(s) for TextFieldArea1 widget.
  FocusNode? textFieldArea1FocusNode;
  TextEditingController? textFieldArea1TextController;
  late MaskTextInputFormatter textFieldArea1Mask;
  String? Function(BuildContext, String?)?
      textFieldArea1TextControllerValidator;
  // State field(s) for TextFieldArea2 widget.
  FocusNode? textFieldArea2FocusNode;
  TextEditingController? textFieldArea2TextController;
  late MaskTextInputFormatter textFieldArea2Mask;
  String? Function(BuildContext, String?)?
      textFieldArea2TextControllerValidator;
  // State field(s) for TextFieldArea3 widget.
  FocusNode? textFieldArea3FocusNode;
  TextEditingController? textFieldArea3TextController;
  late MaskTextInputFormatter textFieldArea3Mask;
  String? Function(BuildContext, String?)?
      textFieldArea3TextControllerValidator;
  // State field(s) for ChoiceChipsAKC widget.
  FormFieldController<List<String>>? choiceChipsAKCValueController;
  String? get choiceChipsAKCValue =>
      choiceChipsAKCValueController?.value?.firstOrNull;
  set choiceChipsAKCValue(String? val) =>
      choiceChipsAKCValueController?.value = val != null ? [val] : [];
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
  // State field(s) for ChoiceChipsWD widget.
  FormFieldController<List<String>>? choiceChipsWDValueController;
  String? get choiceChipsWDValue =>
      choiceChipsWDValueController?.value?.firstOrNull;
  set choiceChipsWDValue(String? val) =>
      choiceChipsWDValueController?.value = val != null ? [val] : [];
  // State field(s) for CountControllerFaultHE widget.
  int? countControllerFaultHEValue;

  @override
  void initState(BuildContext context) {}

  @override
  void dispose() {
    timerSearchController.dispose();
    timerMaxTimeController.dispose();
    instantTimer?.cancel();
    textFieldArea1FocusNode?.dispose();
    textFieldArea1TextController?.dispose();

    textFieldArea2FocusNode?.dispose();
    textFieldArea2TextController?.dispose();

    textFieldArea3FocusNode?.dispose();
    textFieldArea3TextController?.dispose();
  }
}
