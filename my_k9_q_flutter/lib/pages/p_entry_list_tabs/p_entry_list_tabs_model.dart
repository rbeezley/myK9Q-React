import '/backend/supabase/supabase.dart';
import '/components/c_entry_card_combined_section/c_entry_card_combined_section_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'dart:async';
import 'p_entry_list_tabs_widget.dart' show PEntryListTabsWidget;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PEntryListTabsModel extends FlutterFlowModel<PEntryListTabsWidget> {
  ///  Local state fields for this page.

  int pgCounter = 0;

  ///  State fields for stateful widgets in this page.

  Completer<List<ViewEntryClassJoinDistinctRow>>? requestCompleter;
  AudioPlayer? soundPlayer;
  // State field(s) for QueryTabBar widget.
  TabController? queryTabBarController;
  int get queryTabBarCurrentIndex =>
      queryTabBarController != null ? queryTabBarController!.index : 0;
  int get queryTabBarPreviousIndex =>
      queryTabBarController != null ? queryTabBarController!.previousIndex : 0;

  // Stores action output result for [Custom Action - reorderItems] action in ListViewPendingCombinedSection widget.
  List<ViewEntryClassJoinDistinctRow>? aoReorderedList;
  // Models for c_EntryCardCombinedSection dynamic component.
  late FlutterFlowDynamicModels<CEntryCardCombinedSectionModel>
      cEntryCardCombinedSectionModels;
  // State field(s) for ChoiceChipsSort widget.
  FormFieldController<List<String>>? choiceChipsSortValueController;
  String? get choiceChipsSortValue =>
      choiceChipsSortValueController?.value?.firstOrNull;
  set choiceChipsSortValue(String? val) =>
      choiceChipsSortValueController?.value = val != null ? [val] : [];
  // Model for c_NavigationBar component.
  late CNavigationBarModel cNavigationBarModel;

  @override
  void initState(BuildContext context) {
    cEntryCardCombinedSectionModels =
        FlutterFlowDynamicModels(() => CEntryCardCombinedSectionModel());
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    queryTabBarController?.dispose();
    cEntryCardCombinedSectionModels.dispose();
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
