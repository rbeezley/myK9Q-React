import '/backend/supabase/supabase.dart';
import '/components/c_home_entries_card/c_home_entries_card_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/flutter_flow/request_manager.dart';

import '/index.dart';
import 'dart:async';
import 'p_home_widget.dart' show PHomeWidget;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PHomeModel extends FlutterFlowModel<PHomeWidget> {
  ///  State fields for stateful widgets in this page.

  bool requestCompleted1 = false;
  String? requestLastUniqueKey1;
  Completer<List<TblTrialQueueRow>>? requestCompleter2;
  AudioPlayer? soundPlayer;
  // State field(s) for ChoiceChipsSort widget.
  FormFieldController<List<String>>? choiceChipsSortValueController;
  String? get choiceChipsSortValue =>
      choiceChipsSortValueController?.value?.firstOrNull;
  set choiceChipsSortValue(String? val) =>
      choiceChipsSortValueController?.value = val != null ? [val] : [];
  // Models for c_HomeEntriesCard dynamic component.
  late FlutterFlowDynamicModels<CHomeEntriesCardModel> cHomeEntriesCardModels1;
  // Models for c_HomeEntriesCard dynamic component.
  late FlutterFlowDynamicModels<CHomeEntriesCardModel> cHomeEntriesCardModels2;
  // Models for c_HomeEntriesCard dynamic component.
  late FlutterFlowDynamicModels<CHomeEntriesCardModel> cHomeEntriesCardModels3;
  // Models for c_HomeEntriesCard dynamic component.
  late FlutterFlowDynamicModels<CHomeEntriesCardModel> cHomeEntriesCardModels4;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  /// Query cache managers for this widget.

  final _armbandListManager =
      FutureRequestManager<List<ViewUniqueArmbandsRow>>();
  Future<List<ViewUniqueArmbandsRow>> armbandList({
    String? uniqueQueryKey,
    bool? overrideCache,
    required Future<List<ViewUniqueArmbandsRow>> Function() requestFn,
  }) =>
      _armbandListManager.performRequest(
        uniqueQueryKey: uniqueQueryKey,
        overrideCache: overrideCache,
        requestFn: requestFn,
      );
  void clearArmbandListCache() => _armbandListManager.clear();
  void clearArmbandListCacheKey(String? uniqueKey) =>
      _armbandListManager.clearRequest(uniqueKey);

  @override
  void initState(BuildContext context) {
    cHomeEntriesCardModels1 =
        FlutterFlowDynamicModels(() => CHomeEntriesCardModel());
    cHomeEntriesCardModels2 =
        FlutterFlowDynamicModels(() => CHomeEntriesCardModel());
    cHomeEntriesCardModels3 =
        FlutterFlowDynamicModels(() => CHomeEntriesCardModel());
    cHomeEntriesCardModels4 =
        FlutterFlowDynamicModels(() => CHomeEntriesCardModel());
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    cHomeEntriesCardModels1.dispose();
    cHomeEntriesCardModels2.dispose();
    cHomeEntriesCardModels3.dispose();
    cHomeEntriesCardModels4.dispose();
    cNavigationBarModel.dispose();

    /// Dispose query cache managers for this widget.

    clearArmbandListCache();
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
      final requestComplete = requestCompleted1;
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
