import '/backend/supabase/supabase.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'dart:async';
import 'p_entry_list_all_widget.dart' show PEntryListAllWidget;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PEntryListAllModel extends FlutterFlowModel<PEntryListAllWidget> {
  ///  State fields for stateful widgets in this page.

  Completer<List<ViewEntryClassJoinDistinctRow>>? requestCompleter1;
  Completer<List<ViewEntryClassJoinSectionDistinctRow>>? requestCompleter2;
  AudioPlayer? soundPlayer;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
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
