import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/flutter_flow/instant_timer.dart';
import '/index.dart';
import 'p_max_time_stop_watch_widget.dart' show PMaxTimeStopWatchWidget;
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PMaxTimeStopWatchModel extends FlutterFlowModel<PMaxTimeStopWatchWidget> {
  ///  Local state fields for this page.

  int psMaxTimeMS = 0;

  String? psMaxTime;

  ///  State fields for stateful widgets in this page.

  // State field(s) for Switch widget.
  bool? switchValue;
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

  // State field(s) for ccTwoAreas widget.
  FormFieldController<List<String>>? ccTwoAreasValueController;
  String? get ccTwoAreasValue => ccTwoAreasValueController?.value?.firstOrNull;
  set ccTwoAreasValue(String? val) =>
      ccTwoAreasValueController?.value = val != null ? [val] : [];
  // State field(s) for ccThreeAreas widget.
  FormFieldController<List<String>>? ccThreeAreasValueController;
  String? get ccThreeAreasValue =>
      ccThreeAreasValueController?.value?.firstOrNull;
  set ccThreeAreasValue(String? val) =>
      ccThreeAreasValueController?.value = val != null ? [val] : [];
  InstantTimer? Timer30;
  AudioPlayer? soundPlayer1;
  InstantTimer? Timer10;
  AudioPlayer? soundPlayer2;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    timerMaxTimeController.dispose();
    Timer30?.cancel();
    Timer10?.cancel();
    cNavigationBarModel.dispose();
  }
}
