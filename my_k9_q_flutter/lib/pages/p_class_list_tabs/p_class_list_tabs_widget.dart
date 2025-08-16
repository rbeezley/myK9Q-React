import '/backend/supabase/supabase.dart';
import '/components/c_class_completed_card/c_class_completed_card_widget.dart';
import '/components/c_class_header_card/c_class_header_card_widget.dart';
import '/components/c_class_pending_card/c_class_pending_card_widget.dart';
import '/components/c_empty_class_list_pending/c_empty_class_list_pending_widget.dart';
import '/components/c_empty_entry_list_completed/c_empty_entry_list_completed_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/custom_code/actions/index.dart' as actions;
import '/index.dart';
import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'p_class_list_tabs_model.dart';
export 'p_class_list_tabs_model.dart';

class PClassListTabsWidget extends StatefulWidget {
  const PClassListTabsWidget({
    super.key,
    this.ppTrialRow,
  });

  final TblTrialQueueRow? ppTrialRow;

  static String routeName = 'p_ClassListTabs';
  static String routePath = '/pClassListTabs';

  @override
  State<PClassListTabsWidget> createState() => _PClassListTabsWidgetState();
}

class _PClassListTabsWidgetState extends State<PClassListTabsWidget>
    with TickerProviderStateMixin {
  late PClassListTabsModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PClassListTabsModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_ClassListTabs';
      safeSetState(() {});
      await actions.unsubscribe(
        'tbl_entry_queue',
      );
      await actions.unsubscribe(
        'tbl_announcements',
      );
      await actions.subscribe(
        'tbl_entry_queue',
        () async {
          safeSetState(() => _model.requestCompleter2 = null);
          await _model.waitForRequestCompleted2();
          safeSetState(() => _model.requestCompleter1 = null);
          await _model.waitForRequestCompleted1();
        },
      );
      await actions.subscribe(
        'tbl_announcements',
        () async {
          FFAppState().asUnreadDot = true;
          safeSetState(() {});
          safeSetState(() => _model.requestCompleter1 = null);
          await _model.waitForRequestCompleted1();
          _model.soundPlayer ??= AudioPlayer();
          if (_model.soundPlayer!.playing) {
            await _model.soundPlayer!.stop();
          }
          _model.soundPlayer!.setVolume(0.51);
          _model.soundPlayer!
              .setAsset('assets/audios/NewNotification.mp3')
              .then((_) => _model.soundPlayer!.play());
        },
      );
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            'Mark your Dogs and Classes as a favorite to find them easily.',
            style: TextStyle(
              color: FlutterFlowTheme.of(context).alternate,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
          duration: Duration(milliseconds: 4000),
          backgroundColor: FlutterFlowTheme.of(context).secondary,
        ),
      );
    });

    _model.tabBarController = TabController(
      vsync: this,
      length: 2,
      initialIndex: 0,
    )..addListener(() => safeSetState(() {}));

    animationsMap.addAll({
      'listViewOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 850.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
        ],
      ),
    });

    WidgetsBinding.instance.addPostFrameCallback((_) => safeSetState(() {}));
  }

  @override
  void dispose() {
    _model.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return GestureDetector(
      onTap: () {
        FocusScope.of(context).unfocus();
        FocusManager.instance.primaryFocus?.unfocus();
      },
      child: PopScope(
        canPop: false,
        child: Scaffold(
          key: scaffoldKey,
          backgroundColor: FlutterFlowTheme.of(context).primaryBackground,
          appBar: AppBar(
            backgroundColor: FlutterFlowTheme.of(context).appBar,
            automaticallyImplyLeading: false,
            leading: FlutterFlowIconButton(
              borderColor: Colors.transparent,
              borderRadius: 30.0,
              borderWidth: 1.0,
              buttonSize: 60.0,
              icon: Icon(
                Icons.arrow_back_rounded,
                color: FlutterFlowTheme.of(context).colorWhite,
                size: 30.0,
              ),
              onPressed: () async {
                HapticFeedback.heavyImpact();
                if (Navigator.of(context).canPop()) {
                  context.pop();
                }
                context.pushNamed(
                  PHomeWidget.routeName,
                  extra: <String, dynamic>{
                    kTransitionInfoKey: TransitionInfo(
                      hasTransition: true,
                      transitionType: PageTransitionType.leftToRight,
                    ),
                  },
                );
              },
            ),
            title: Text(
              'Select Class',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: Colors.white,
                    fontSize: 22.0,
                    letterSpacing: 0.0,
                    useGoogleFonts:
                        !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                  ),
            ),
            actions: [
              FlutterFlowIconButton(
                borderColor: Colors.transparent,
                borderRadius: 30.0,
                borderWidth: 1.0,
                buttonSize: 50.0,
                icon: Icon(
                  Icons.refresh_rounded,
                  color: FlutterFlowTheme.of(context).colorWhite,
                  size: 30.0,
                ),
                onPressed: () async {
                  HapticFeedback.heavyImpact();
                  safeSetState(() => _model.requestCompleter2 = null);
                  await _model.waitForRequestCompleted2();
                  safeSetState(() => _model.requestCompleter1 = null);
                  await _model.waitForRequestCompleted1();
                },
              ),
            ],
            centerTitle: true,
            elevation: 0.0,
          ),
          body: SafeArea(
            top: true,
            child: Stack(
              children: [
                Align(
                  alignment: AlignmentDirectional(0.0, 0.0),
                  child: FutureBuilder<List<TblClassQueueRow>>(
                    future: (_model.requestCompleter2 ??=
                            Completer<List<TblClassQueueRow>>()
                              ..complete(TblClassQueueTable().queryRows(
                                queryFn: (q) => q
                                    .eqOrNull(
                                      'mobile_app_lic_key',
                                      widget.ppTrialRow?.mobileAppLicKey,
                                    )
                                    .eqOrNull(
                                      'trialid_fk',
                                      widget.ppTrialRow?.trialid,
                                    )
                                    .order('in_progress')
                                    .order('class_order', ascending: true)
                                    .order('element', ascending: true)
                                    .order('level', ascending: true),
                              )))
                        .future,
                    builder: (context, snapshot) {
                      // Customize what your widget looks like when it's loading.
                      if (!snapshot.hasData) {
                        return Center(
                          child: SizedBox(
                            width: 50.0,
                            height: 50.0,
                            child: SpinKitCircle(
                              color: FlutterFlowTheme.of(context).primary,
                              size: 50.0,
                            ),
                          ),
                        );
                      }
                      List<TblClassQueueRow> classQueryTblClassQueueRowList =
                          snapshot.data!;

                      return Container(
                        width: double.infinity,
                        height: double.infinity,
                        constraints: BoxConstraints(
                          maxWidth: 479.0,
                        ),
                        decoration: BoxDecoration(
                          color: FlutterFlowTheme.of(context).primaryBackground,
                        ),
                        child: Column(
                          mainAxisSize: MainAxisSize.max,
                          children: [
                            wrapWithModel(
                              model: _model.cClassHeaderCardModel,
                              updateCallback: () => safeSetState(() {}),
                              child: CClassHeaderCardWidget(
                                cpTrialDate: valueOrDefault<String>(
                                  widget.ppTrialRow?.trialDate,
                                  'Trial Date',
                                ),
                                cpTrialNumber: valueOrDefault<String>(
                                  widget.ppTrialRow?.trialNumber,
                                  'Trial Number',
                                ),
                                cpClassCount:
                                    widget.ppTrialRow?.classTotalCount,
                              ),
                            ),
                            Expanded(
                              child: Column(
                                children: [
                                  Align(
                                    alignment: Alignment(0.0, 0),
                                    child: TabBar(
                                      labelColor: FlutterFlowTheme.of(context)
                                          .primaryText,
                                      unselectedLabelColor:
                                          FlutterFlowTheme.of(context).grayIcon,
                                      labelStyle: FlutterFlowTheme.of(context)
                                          .titleSmall
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .titleSmallFamily,
                                            fontSize: 14.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.w600,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .titleSmallIsCustom,
                                          ),
                                      unselectedLabelStyle: FlutterFlowTheme.of(
                                              context)
                                          .titleSmall
                                          .override(
                                            fontFamily:
                                                FlutterFlowTheme.of(context)
                                                    .titleSmallFamily,
                                            fontSize: 14.0,
                                            letterSpacing: 0.0,
                                            fontWeight: FontWeight.normal,
                                            useGoogleFonts:
                                                !FlutterFlowTheme.of(context)
                                                    .titleSmallIsCustom,
                                          ),
                                      indicatorColor:
                                          FlutterFlowTheme.of(context).primary,
                                      indicatorWeight: 2.0,
                                      tabs: [
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 4.0, 0.0),
                                              child: Icon(
                                                Icons.pending_actions_rounded,
                                              ),
                                            ),
                                            Tab(
                                              text:
                                                  '${classQueryTblClassQueueRowList.where((e) => e.entryPendingCount != 0).toList().length.toString()} Pending',
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 4.0, 0.0),
                                              child: Icon(
                                                Icons.fact_check_rounded,
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .tertiary,
                                              ),
                                            ),
                                            Tab(
                                              text: valueOrDefault<String>(
                                                '${classQueryTblClassQueueRowList.where((e) => e.entryPendingCount == 0).toList().length.toString()}  Completed',
                                                '- Completed',
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                      controller: _model.tabBarController,
                                      onTap: (i) async {
                                        [() async {}, () async {}][i]();
                                      },
                                    ),
                                  ),
                                  Expanded(
                                    child: TabBarView(
                                      controller: _model.tabBarController,
                                      children: [
                                        KeepAliveWidgetWrapper(
                                          builder: (context) => FutureBuilder<
                                              List<
                                                  ViewEntryClassJoinDistinctRow>>(
                                            future: (_model
                                                        .requestCompleter1 ??=
                                                    Completer<
                                                        List<
                                                            ViewEntryClassJoinDistinctRow>>()
                                                      ..complete(
                                                          ViewEntryClassJoinDistinctTable()
                                                              .queryRows(
                                                        queryFn: (q) => q
                                                            .eqOrNull(
                                                              'mobile_app_lic_key',
                                                              FFAppState()
                                                                  .asMobileAppLicKey,
                                                            )
                                                            .eqOrNull(
                                                              'trialid_fk',
                                                              widget.ppTrialRow
                                                                  ?.trialid,
                                                            ),
                                                      )))
                                                .future,
                                            builder: (context, snapshot) {
                                              // Customize what your widget looks like when it's loading.
                                              if (!snapshot.hasData) {
                                                return Center(
                                                  child: SizedBox(
                                                    width: 50.0,
                                                    height: 50.0,
                                                    child: SpinKitCircle(
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primary,
                                                      size: 50.0,
                                                    ),
                                                  ),
                                                );
                                              }
                                              List<ViewEntryClassJoinDistinctRow>
                                                  entryPendingViewEntryClassJoinDistinctRowList =
                                                  snapshot.data!;

                                              return Container(
                                                width: double.infinity,
                                                height: 960.0,
                                                decoration: BoxDecoration(
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .primaryBackground,
                                                ),
                                                child: Column(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Padding(
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  8.0,
                                                                  8.0,
                                                                  8.0,
                                                                  0.0),
                                                      child: Container(
                                                        decoration:
                                                            BoxDecoration(
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .secondaryBackground,
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(
                                                                      8.0),
                                                        ),
                                                        child: Align(
                                                          alignment:
                                                              AlignmentDirectional(
                                                                  0.0, 0.0),
                                                          child: Padding(
                                                            padding:
                                                                EdgeInsets.all(
                                                                    8.0),
                                                            child:
                                                                FlutterFlowChoiceChips(
                                                              options: [
                                                                ChipData('All'),
                                                                ChipData(
                                                                    'Favorites'),
                                                                ChipData(
                                                                    'In-Progress')
                                                              ],
                                                              onChanged:
                                                                  (val) async {
                                                                safeSetState(() =>
                                                                    _model.choiceChipsFilterValue =
                                                                        val?.firstOrNull);
                                                                HapticFeedback
                                                                    .heavyImpact();
                                                                _model.pgClassFilter =
                                                                    _model
                                                                        .choiceChipsFilterValue!;
                                                                safeSetState(
                                                                    () {});
                                                              },
                                                              selectedChipStyle:
                                                                  ChipStyle(
                                                                backgroundColor:
                                                                    FlutterFlowTheme.of(
                                                                            context)
                                                                        .backgroundComponents,
                                                                textStyle: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .override(
                                                                      fontFamily:
                                                                          FlutterFlowTheme.of(context)
                                                                              .bodyMediumFamily,
                                                                      color: FlutterFlowTheme.of(
                                                                              context)
                                                                          .colorWhite,
                                                                      letterSpacing:
                                                                          0.0,
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .normal,
                                                                      useGoogleFonts:
                                                                          !FlutterFlowTheme.of(context)
                                                                              .bodyMediumIsCustom,
                                                                    ),
                                                                iconColor: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                iconSize: 0.0,
                                                                elevation: 4.0,
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            12.0),
                                                              ),
                                                              unselectedChipStyle:
                                                                  ChipStyle(
                                                                backgroundColor:
                                                                    FlutterFlowTheme.of(
                                                                            context)
                                                                        .accent4,
                                                                textStyle: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .override(
                                                                      fontFamily:
                                                                          FlutterFlowTheme.of(context)
                                                                              .bodyMediumFamily,
                                                                      color: FlutterFlowTheme.of(
                                                                              context)
                                                                          .secondaryText,
                                                                      letterSpacing:
                                                                          0.0,
                                                                      useGoogleFonts:
                                                                          !FlutterFlowTheme.of(context)
                                                                              .bodyMediumIsCustom,
                                                                    ),
                                                                iconColor: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                iconSize: 16.0,
                                                                elevation: 0.0,
                                                                borderRadius:
                                                                    BorderRadius
                                                                        .circular(
                                                                            12.0),
                                                              ),
                                                              chipSpacing: 12.0,
                                                              rowSpacing: 8.0,
                                                              multiselect:
                                                                  false,
                                                              initialized: _model
                                                                      .choiceChipsFilterValue !=
                                                                  null,
                                                              alignment:
                                                                  WrapAlignment
                                                                      .spaceEvenly,
                                                              controller: _model
                                                                      .choiceChipsFilterValueController ??=
                                                                  FormFieldController<
                                                                      List<
                                                                          String>>(
                                                                [
                                                                  valueOrDefault<
                                                                      String>(
                                                                    _model
                                                                        .pgClassFilter,
                                                                    'All',
                                                                  )
                                                                ],
                                                              ),
                                                              wrapped: true,
                                                            ),
                                                          ),
                                                        ),
                                                      ),
                                                    ),
                                                    Expanded(
                                                      child: Builder(
                                                        builder: (context) {
                                                          if (_model
                                                                  .choiceChipsFilterValue ==
                                                              'In-Progress') {
                                                            return
                                                                // CHANGE listViewPendingClassesGetClassesResponse.jsonBody TO classListPendingItem
                                                                Builder(
                                                              builder:
                                                                  (context) {
                                                                final chClassesInProgress = classQueryTblClassQueueRowList
                                                                    .where((e) =>
                                                                        (e.entryPendingCount >
                                                                            0) &&
                                                                        (e.classStatus ==
                                                                            5))
                                                                    .toList();
                                                                if (chClassesInProgress
                                                                    .isEmpty) {
                                                                  return Container(
                                                                    height:
                                                                        960.0,
                                                                    child:
                                                                        CEmptyClassListPendingWidget(),
                                                                  );
                                                                }

                                                                return RefreshIndicator(
                                                                  key: Key(
                                                                      'RefreshIndicator_oueuojip'),
                                                                  onRefresh:
                                                                      () async {},
                                                                  child: ListView
                                                                      .separated(
                                                                    padding: EdgeInsets.symmetric(
                                                                        vertical:
                                                                            8.0),
                                                                    primary:
                                                                        false,
                                                                    scrollDirection:
                                                                        Axis.vertical,
                                                                    itemCount:
                                                                        chClassesInProgress
                                                                            .length,
                                                                    separatorBuilder: (_,
                                                                            __) =>
                                                                        SizedBox(
                                                                            height:
                                                                                8.0),
                                                                    itemBuilder:
                                                                        (context,
                                                                            chClassesInProgressIndex) {
                                                                      final chClassesInProgressItem =
                                                                          chClassesInProgress[
                                                                              chClassesInProgressIndex];
                                                                      return wrapWithModel(
                                                                        model: _model
                                                                            .cClassPendingCardModels1
                                                                            .getModel(
                                                                          'ukClassPendingCard',
                                                                          chClassesInProgressIndex,
                                                                        ),
                                                                        updateCallback:
                                                                            () =>
                                                                                safeSetState(() {}),
                                                                        updateOnChange:
                                                                            true,
                                                                        child:
                                                                            CClassPendingCardWidget(
                                                                          key:
                                                                              Key(
                                                                            'Keynan_${'ukClassPendingCard'}',
                                                                          ),
                                                                          cpViewEntry: entryPendingViewEntryClassJoinDistinctRowList
                                                                              .where((e) => (e.mobileAppLicKey == FFAppState().asMobileAppLicKey) && (e.element == chClassesInProgressItem.element) && (e.level == chClassesInProgressItem.level) && (e.isScored == false))
                                                                              .toList()
                                                                              .sortedList(keyOf: (e) => e.sortOrder!, desc: false),
                                                                          cpClassQueue:
                                                                              chClassesInProgressItem,
                                                                          cpTrialQueue:
                                                                              widget.ppTrialRow,
                                                                        ),
                                                                      );
                                                                    },
                                                                  ),
                                                                );
                                                              },
                                                            );
                                                          } else if (_model
                                                                  .choiceChipsFilterValue ==
                                                              'Favorites') {
                                                            return
                                                                // CHANGE listViewPendingClassesGetClassesResponse.jsonBody TO classListPendingItem
                                                                Builder(
                                                              builder:
                                                                  (context) {
                                                                final chClassesFavorites = classQueryTblClassQueueRowList
                                                                    .where((e) =>
                                                                        (e.entryPendingCount >
                                                                            0) &&
                                                                        FFAppState()
                                                                            .asFavoriteClass
                                                                            .contains(e
                                                                                .id))
                                                                    .toList()
                                                                    .sortedList(
                                                                        keyOf: (e) => e
                                                                            .element,
                                                                        desc:
                                                                            false)
                                                                    .toList();
                                                                if (chClassesFavorites
                                                                    .isEmpty) {
                                                                  return Container(
                                                                    height:
                                                                        960.0,
                                                                    child:
                                                                        CEmptyClassListPendingWidget(),
                                                                  );
                                                                }

                                                                return RefreshIndicator(
                                                                  key: Key(
                                                                      'RefreshIndicator_m4rbi9ek'),
                                                                  onRefresh:
                                                                      () async {},
                                                                  child: ListView
                                                                      .separated(
                                                                    padding: EdgeInsets.symmetric(
                                                                        vertical:
                                                                            8.0),
                                                                    primary:
                                                                        false,
                                                                    scrollDirection:
                                                                        Axis.vertical,
                                                                    itemCount:
                                                                        chClassesFavorites
                                                                            .length,
                                                                    separatorBuilder: (_,
                                                                            __) =>
                                                                        SizedBox(
                                                                            height:
                                                                                8.0),
                                                                    itemBuilder:
                                                                        (context,
                                                                            chClassesFavoritesIndex) {
                                                                      final chClassesFavoritesItem =
                                                                          chClassesFavorites[
                                                                              chClassesFavoritesIndex];
                                                                      return wrapWithModel(
                                                                        model: _model
                                                                            .cClassPendingCardModels2
                                                                            .getModel(
                                                                          'ukClassPendingCard',
                                                                          chClassesFavoritesIndex,
                                                                        ),
                                                                        updateCallback:
                                                                            () =>
                                                                                safeSetState(() {}),
                                                                        child:
                                                                            CClassPendingCardWidget(
                                                                          key:
                                                                              Key(
                                                                            'Keyy7q_${'ukClassPendingCard'}',
                                                                          ),
                                                                          cpViewEntry: entryPendingViewEntryClassJoinDistinctRowList
                                                                              .where((e) => (e.mobileAppLicKey == FFAppState().asMobileAppLicKey) && (e.element == chClassesFavoritesItem.element) && (e.level == chClassesFavoritesItem.level) && (e.isScored == false))
                                                                              .toList()
                                                                              .sortedList(keyOf: (e) => e.sortOrder!, desc: false),
                                                                          cpClassQueue:
                                                                              chClassesFavoritesItem,
                                                                          cpTrialQueue:
                                                                              widget.ppTrialRow,
                                                                        ),
                                                                      );
                                                                    },
                                                                  ),
                                                                );
                                                              },
                                                            );
                                                          } else {
                                                            return
                                                                // CHANGE listViewPendingClassesGetClassesResponse.jsonBody TO classListPendingItem
                                                                Builder(
                                                              builder:
                                                                  (context) {
                                                                final chClassesAll =
                                                                    classQueryTblClassQueueRowList
                                                                        .where((e) =>
                                                                            e.entryPendingCount >
                                                                            0)
                                                                        .toList();
                                                                if (chClassesAll
                                                                    .isEmpty) {
                                                                  return Container(
                                                                    height:
                                                                        960.0,
                                                                    child:
                                                                        CEmptyClassListPendingWidget(),
                                                                  );
                                                                }

                                                                return RefreshIndicator(
                                                                  key: Key(
                                                                      'RefreshIndicator_j54rxxqp'),
                                                                  onRefresh:
                                                                      () async {},
                                                                  child: ListView
                                                                      .separated(
                                                                    padding: EdgeInsets.symmetric(
                                                                        vertical:
                                                                            8.0),
                                                                    primary:
                                                                        false,
                                                                    scrollDirection:
                                                                        Axis.vertical,
                                                                    itemCount:
                                                                        chClassesAll
                                                                            .length,
                                                                    separatorBuilder: (_,
                                                                            __) =>
                                                                        SizedBox(
                                                                            height:
                                                                                8.0),
                                                                    itemBuilder:
                                                                        (context,
                                                                            chClassesAllIndex) {
                                                                      final chClassesAllItem =
                                                                          chClassesAll[
                                                                              chClassesAllIndex];
                                                                      return wrapWithModel(
                                                                        model: _model
                                                                            .cClassPendingCardModels3
                                                                            .getModel(
                                                                          'ukClassPendingCard',
                                                                          chClassesAllIndex,
                                                                        ),
                                                                        updateCallback:
                                                                            () =>
                                                                                safeSetState(() {}),
                                                                        child:
                                                                            CClassPendingCardWidget(
                                                                          key:
                                                                              Key(
                                                                            'Keyh0h_${'ukClassPendingCard'}',
                                                                          ),
                                                                          cpClassQueue:
                                                                              chClassesAllItem,
                                                                          cpTrialQueue:
                                                                              widget.ppTrialRow,
                                                                          cpViewEntry: entryPendingViewEntryClassJoinDistinctRowList
                                                                              .where((e) => (e.mobileAppLicKey == FFAppState().asMobileAppLicKey) && (e.element == chClassesAllItem.element) && (e.level == chClassesAllItem.level) && (e.isScored == false))
                                                                              .toList()
                                                                              .sortedList(keyOf: (e) => e.sortOrder!, desc: false),
                                                                        ),
                                                                      );
                                                                    },
                                                                  ),
                                                                );
                                                              },
                                                            );
                                                          }
                                                        },
                                                      ),
                                                    ),
                                                  ].addToEnd(SizedBox(
                                                      height: MediaQuery.sizeOf(
                                                                      context)
                                                                  .width <
                                                              kBreakpointSmall
                                                          ? 72.0
                                                          : 16.0)),
                                                ),
                                              );
                                            },
                                          ),
                                        ),
                                        KeepAliveWidgetWrapper(
                                          builder: (context) => Container(
                                            width: double.infinity,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .primaryBackground,
                                            ),
                                            child: Column(
                                              mainAxisSize: MainAxisSize.max,
                                              children: [
                                                Expanded(
                                                  child: Builder(
                                                    builder: (context) {
                                                      final completedClasses =
                                                          classQueryTblClassQueueRowList
                                                              .where((e) =>
                                                                  e.entryPendingCount ==
                                                                  0)
                                                              .toList();
                                                      if (completedClasses
                                                          .isEmpty) {
                                                        return CEmptyEntryListCompletedWidget();
                                                      }

                                                      return RefreshIndicator(
                                                        onRefresh: () async {},
                                                        child:
                                                            ListView.separated(
                                                          padding: EdgeInsets
                                                              .symmetric(
                                                                  vertical:
                                                                      8.0),
                                                          scrollDirection:
                                                              Axis.vertical,
                                                          itemCount:
                                                              completedClasses
                                                                  .length,
                                                          separatorBuilder: (_,
                                                                  __) =>
                                                              SizedBox(
                                                                  height: 8.0),
                                                          itemBuilder: (context,
                                                              completedClassesIndex) {
                                                            final completedClassesItem =
                                                                completedClasses[
                                                                    completedClassesIndex];
                                                            return wrapWithModel(
                                                              model: _model
                                                                  .cClassCompletedCardModels
                                                                  .getModel(
                                                                'ukClassCompletedCard',
                                                                completedClassesIndex,
                                                              ),
                                                              updateCallback: () =>
                                                                  safeSetState(
                                                                      () {}),
                                                              child:
                                                                  CClassCompletedCardWidget(
                                                                key: Key(
                                                                  'Keywx4_${'ukClassCompletedCard'}',
                                                                ),
                                                                cpClassQueue:
                                                                    completedClassesItem,
                                                                cpTrialQueue:
                                                                    widget
                                                                        .ppTrialRow,
                                                              ),
                                                            );
                                                          },
                                                        ),
                                                      ).animateOnPageLoad(
                                                          animationsMap[
                                                              'listViewOnPageLoadAnimation']!);
                                                    },
                                                  ),
                                                ),
                                              ].addToEnd(SizedBox(
                                                  height:
                                                      MediaQuery.sizeOf(context)
                                                                  .width <
                                                              kBreakpointSmall
                                                          ? 72.0
                                                          : 16.0)),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Align(
                  alignment: AlignmentDirectional(0.0, 1.0),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(
                      cpSelectedPageIndex: 11,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
