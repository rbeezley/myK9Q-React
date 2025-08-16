import '/backend/supabase/supabase.dart';
import '/components/c_entry_card_separate_section/c_entry_card_separate_section_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'dart:async';
import 'p_entry_list_tabs_seperate_section_widget.dart'
    show PEntryListTabsSeperateSectionWidget;
import 'package:flutter/material.dart';
import 'package:just_audio/just_audio.dart';

class PEntryListTabsSeperateSectionModel
    extends FlutterFlowModel<PEntryListTabsSeperateSectionWidget> {
  ///  State fields for stateful widgets in this page.

  Completer<List<ViewEntryClassJoinSectionDistinctRow>>? requestCompleter;
  AudioPlayer? soundPlayer;
  // State field(s) for QueryTabBar widget.
  TabController? queryTabBarController;
  int get queryTabBarCurrentIndex =>
      queryTabBarController != null ? queryTabBarController!.index : 0;
  int get queryTabBarPreviousIndex =>
      queryTabBarController != null ? queryTabBarController!.previousIndex : 0;

  // Models for c_EntryCardSeparateSection dynamic component.
  late FlutterFlowDynamicModels<CEntryCardSeparateSectionModel>
      cEntryCardSeparateSectionModels;
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
    cEntryCardSeparateSectionModels =
        FlutterFlowDynamicModels(() => CEntryCardSeparateSectionModel());
    cNavigationBarModel = createModel(context, () => CNavigationBarModel());
  }

  @override
  void dispose() {
    queryTabBarController?.dispose();
    cEntryCardSeparateSectionModels.dispose();
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
