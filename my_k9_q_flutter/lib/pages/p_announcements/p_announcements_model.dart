import '/backend/supabase/supabase.dart';
import '/components/c_annc_card/c_annc_card_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'dart:async';
import 'p_announcements_widget.dart' show PAnnouncementsWidget;
import 'package:flutter/material.dart';

class PAnnouncementsModel extends FlutterFlowModel<PAnnouncementsWidget> {
  ///  State fields for stateful widgets in this page.

  Completer<List<TblAnnouncementsRow>>? requestCompleter;
  // Models for c_AnncCard dynamic component.
  late FlutterFlowDynamicModels<CAnncCardModel> cAnncCardModels;
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cAnncCardModels = FlutterFlowDynamicModels(() => CAnncCardModel());
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    cAnncCardModels.dispose();
    cNavigationBarModel.dispose();
  }

  /// Additional helper methods.
  Future waitForRequestCompleted({
    double minWait = 0,
    double maxWait = double.infinity,
  }) async {
    final stopwatch = Stopwatch()..start();
    while (true) {
      await Future.delayed(Duration(milliseconds: 50));
      final timeElapsed = stopwatch.elapsedMilliseconds;
      final requestComplete = requestCompleter?.isCompleted ?? false;
      if (timeElapsed > maxWait || (requestComplete && timeElapsed > minWait)) {
        break;
      }
    }
  }
}
