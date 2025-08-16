import '/backend/supabase/supabase.dart';
import '/components/c_class_completed_card/c_class_completed_card_widget.dart';
import '/components/c_class_header_card/c_class_header_card_widget.dart';
import '/components/c_class_pending_card/c_class_pending_card_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'dart:async';
import 'p_class_list_tabs_widget.dart' show PClassListTabsWidget;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PClassListTabsModel extends FlutterFlowModel<PClassListTabsWidget> {
  ///  Local state fields for this page.

  String pgClassFilter = 'All';

  ///  State fields for stateful widgets in this page.

  Completer<List<ViewEntryClassJoinDistinctRow>>? requestCompleter1;
  Completer<List<TblClassQueueRow>>? requestCompleter2;
  AudioPlayer? soundPlayer;
  // Model for c_ClassHeaderCard component.
  late CClassHeaderCardModel cClassHeaderCardModel;
  // State field(s) for TabBar widget.
  TabController? tabBarController;
  int get tabBarCurrentIndex =>
      tabBarController != null ? tabBarController!.index : 0;
  int get tabBarPreviousIndex =>
      tabBarController != null ? tabBarController!.previousIndex : 0;

  // State field(s) for ChoiceChipsFilter widget.
  FormFieldController<List<String>>? choiceChipsFilterValueController;
  String? get choiceChipsFilterValue =>
      choiceChipsFilterValueController?.value?.firstOrNull;
  set choiceChipsFilterValue(String? val) =>
      choiceChipsFilterValueController?.value = val != null ? [val] : [];
  // Models for c_ClassPendingCard dynamic component.
  late FlutterFlowDynamicModels<CClassPendingCardModel>
      cClassPendingCardModels1;
  // Models for c_ClassPendingCard dynamic component.
  late FlutterFlowDynamicModels<CClassPendingCardModel>
      cClassPendingCardModels2;
  // Models for c_ClassPendingCard dynamic component.
  late FlutterFlowDynamicModels<CClassPendingCardModel>
      cClassPendingCardModels3;
  // Models for c_ClassCompletedCard dynamic component.
  late FlutterFlowDynamicModels<CClassCompletedCardModel>
      cClassCompletedCardModels;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cClassHeaderCardModel = createModel(context, () => CClassHeaderCardModel());
    cClassPendingCardModels1 =
        FlutterFlowDynamicModels(() => CClassPendingCardModel());
    cClassPendingCardModels2 =
        FlutterFlowDynamicModels(() => CClassPendingCardModel());
    cClassPendingCardModels3 =
        FlutterFlowDynamicModels(() => CClassPendingCardModel());
    cClassCompletedCardModels =
        FlutterFlowDynamicModels(() => CClassCompletedCardModel());
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    cClassHeaderCardModel.dispose();
    tabBarController?.dispose();
    cClassPendingCardModels1.dispose();
    cClassPendingCardModels2.dispose();
    cClassPendingCardModels3.dispose();
    cClassCompletedCardModels.dispose();
    cNavigationBarModel.dispose();
  }

  /// Additional helper methods.
  Future waitForRequestCompleted1({
    double minWait = 0,
    double maxWait = double.infinity,
  }) async {
    final stopwatch = Stopwatch()..start();
    while (true) {
      await Future.delayed(Duration(milliseconds: 50));
      final timeElapsed = stopwatch.elapsedMilliseconds;
      final requestComplete = requestCompleter1?.isCompleted ?? false;
      if (timeElapsed > maxWait || (requestComplete && timeElapsed > minWait)) {
        break;
      }
    }
  }

  Future waitForRequestCompleted2({
    double minWait = 0,
    double maxWait = double.infinity,
  }) async {
    final stopwatch = Stopwatch()..start();
    while (true) {
      await Future.delayed(Duration(milliseconds: 50));
      final timeElapsed = stopwatch.elapsedMilliseconds;
      final requestComplete = requestCompleter2?.isCompleted ?? false;
      if (timeElapsed > maxWait || (requestComplete && timeElapsed > minWait)) {
        break;
      }
    }
  }
}
