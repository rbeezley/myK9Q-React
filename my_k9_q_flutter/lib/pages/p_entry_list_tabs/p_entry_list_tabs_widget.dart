import '/backend/supabase/supabase.dart';
import '/components/c_class_requirements_a_k_c/c_class_requirements_a_k_c_widget.dart';
import '/components/c_confirm_move_to_pending_combined_section/c_confirm_move_to_pending_combined_section_widget.dart';
import '/components/c_empty_entry_list_completed/c_empty_entry_list_completed_widget.dart';
import '/components/c_empty_entry_list_pending/c_empty_entry_list_pending_widget.dart';
import '/components/c_empty_list/c_empty_list_widget.dart';
import '/components/c_entry_card_combined_section/c_entry_card_combined_section_widget.dart';
import '/components/c_loading_entries/c_loading_entries_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'dart:async';
import 'package:badges/badges.dart' as badges;
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'p_entry_list_tabs_model.dart';
export 'p_entry_list_tabs_model.dart';

class PEntryListTabsWidget extends StatefulWidget {
  const PEntryListTabsWidget({
    super.key,
    this.ppTrialRow,
    this.ppClassRow,
  });

  final TblTrialQueueRow? ppTrialRow;
  final TblClassQueueRow? ppClassRow;

  static String routeName = 'p_EntryListTabs';
  static String routePath = '/entryListTabs';

  @override
  State<PEntryListTabsWidget> createState() => _PEntryListTabsWidgetState();
}

class _PEntryListTabsWidgetState extends State<PEntryListTabsWidget>
    with TickerProviderStateMixin {
  late PEntryListTabsModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PEntryListTabsModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_EntryListTabs';
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
          safeSetState(() => _model.requestCompleter = null);
        },
      );
      await actions.subscribe(
        'tbl_announcements',
        () async {
          FFAppState().asUnreadDot = true;
          safeSetState(() {});
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
    });

    _model.queryTabBarController = TabController(
      vsync: this,
      length: 2,
      initialIndex: 0,
    )..addListener(() => safeSetState(() {}));

    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          MoveEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: Offset(100.0, 0.0),
            end: Offset(0.0, 0.0),
          ),
          MoveEffect(
            curve: Curves.easeInOut,
            delay: 300.0.ms,
            duration: 600.0.ms,
            begin: Offset(0.0, 0.0),
            end: Offset(0.0, 0.0),
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
                  PClassListTabsWidget.routeName,
                  queryParameters: {
                    'ppTrialRow': serializeParam(
                      widget.ppTrialRow,
                      ParamType.SupabaseRow,
                    ),
                  }.withoutNulls,
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
              'Select Entry',
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
                  safeSetState(() => _model.requestCompleter = null);
                  await _model.waitForRequestCompleted();
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
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    constraints: BoxConstraints(
                      maxWidth: 479.0,
                    ),
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).primaryBackground,
                      borderRadius: BorderRadius.only(
                        bottomLeft: Radius.circular(0.0),
                        bottomRight: Radius.circular(0.0),
                        topLeft: Radius.circular(0.0),
                        topRight: Radius.circular(0.0),
                      ),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Builder(
                          builder: (context) => Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                8.0, 8.0, 8.0, 0.0),
                            child: InkWell(
                              splashColor: Colors.transparent,
                              focusColor: Colors.transparent,
                              hoverColor: Colors.transparent,
                              highlightColor: Colors.transparent,
                              onTap: () async {
                                HapticFeedback.heavyImpact();
                                if (FFAppState().asOrg == 'UKC Obedience') {
                                  return;
                                }

                                await showDialog(
                                  context: context,
                                  builder: (dialogContext) {
                                    return Dialog(
                                      elevation: 0,
                                      insetPadding: EdgeInsets.zero,
                                      backgroundColor: Colors.transparent,
                                      alignment: AlignmentDirectional(0.0, 0.0)
                                          .resolve(Directionality.of(context)),
                                      child: GestureDetector(
                                        onTap: () {
                                          FocusScope.of(dialogContext)
                                              .unfocus();
                                          FocusManager.instance.primaryFocus
                                              ?.unfocus();
                                        },
                                        child: CClassRequirementsAKCWidget(
                                          cpClassRow: widget.ppClassRow!,
                                        ),
                                      ),
                                    );
                                  },
                                );

                                return;
                              },
                              child: Material(
                                color: Colors.transparent,
                                elevation: 3.0,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(8.0),
                                ),
                                child: Container(
                                  width: double.infinity,
                                  decoration: BoxDecoration(
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryBackground,
                                    boxShadow: [
                                      BoxShadow(
                                        blurRadius: 4.0,
                                        color: Color(0x33000000),
                                        offset: Offset(
                                          0.0,
                                          2.0,
                                        ),
                                      )
                                    ],
                                    borderRadius: BorderRadius.circular(8.0),
                                    border: Border.all(
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryBackground,
                                      width: 2.0,
                                    ),
                                  ),
                                  child: Padding(
                                    padding: EdgeInsets.all(4.0),
                                    child: Column(
                                      mainAxisSize: MainAxisSize.max,
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          children: [
                                            SelectionArea(
                                                child: Text(
                                              valueOrDefault<String>(
                                                widget.ppTrialRow?.trialDate,
                                                'Trial Date',
                                              ),
                                              style:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMediumFamily,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                            )),
                                            Icon(
                                              Icons.chevron_right_rounded,
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .primary,
                                              size: 24.0,
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 4.0, 0.0),
                                              child: Text(
                                                '${widget.ppTrialRow?.trialNumber}   ${widget.ppClassRow?.element} ${widget.ppClassRow?.level} ${FFAppState().asOrg == 'UKC Obedience' ? widget.ppClassRow?.section : '  '}',
                                                style:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMedium
                                                        .override(
                                                          fontFamily:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMediumFamily,
                                                          letterSpacing: 0.0,
                                                          useGoogleFonts:
                                                              !FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMediumIsCustom,
                                                        ),
                                              ),
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceBetween,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              valueOrDefault<String>(
                                                widget.ppClassRow?.judgeName,
                                                'Judge Name',
                                              ).maybeHandleOverflow(
                                                maxChars: 20,
                                                replacement: '…',
                                              ),
                                              style:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMediumFamily,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                            ),
                                            Text(
                                              '${widget.ppClassRow?.entryTotalCount.toString()} Entries',
                                              style:
                                                  FlutterFlowTheme.of(context)
                                                      .bodyMedium
                                                      .override(
                                                        fontFamily:
                                                            FlutterFlowTheme.of(
                                                                    context)
                                                                .bodyMediumFamily,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ),
                        Expanded(
                          child: FutureBuilder<
                              List<ViewEntryClassJoinDistinctRow>>(
                            future: (_model.requestCompleter ??= Completer<
                                    List<ViewEntryClassJoinDistinctRow>>()
                                  ..complete(ViewEntryClassJoinDistinctTable()
                                      .queryRows(
                                    queryFn: (q) => q
                                        .eqOrNull(
                                          'mobile_app_lic_key',
                                          FFAppState().asMobileAppLicKey,
                                        )
                                        .eqOrNull(
                                          'trial_date',
                                          widget.ppTrialRow?.trialDate,
                                        )
                                        .eqOrNull(
                                          'element',
                                          widget.ppClassRow?.element,
                                        )
                                        .eqOrNull(
                                          'level',
                                          widget.ppClassRow?.level,
                                        )
                                        .eqOrNull(
                                          'trial_number',
                                          widget.ppTrialRow?.trialNumber,
                                        )
                                        .order('in_ring')
                                        .order('sort_order', ascending: true)
                                        .order('armband', ascending: true),
                                  )))
                                .future,
                            builder: (context, snapshot) {
                              // Customize what your widget looks like when it's loading.
                              if (!snapshot.hasData) {
                                return CLoadingEntriesWidget();
                              }
                              List<ViewEntryClassJoinDistinctRow>
                                  queryTabBarViewEntryClassJoinDistinctRowList =
                                  snapshot.data!;

                              return Column(
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
                                                  .fromSTEB(0.0, 0.0, 5.0, 0.0),
                                              child: Icon(
                                                Icons.pending_actions_rounded,
                                              ),
                                            ),
                                            Tab(
                                              text:
                                                  '${queryTabBarViewEntryClassJoinDistinctRowList.where((e) => e.isScored == false).toList().length.toString()} Pending',
                                            ),
                                          ],
                                        ),
                                        Row(
                                          mainAxisAlignment:
                                              MainAxisAlignment.center,
                                          children: [
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 5.0, 0.0),
                                              child: Icon(
                                                Icons.fact_check_rounded,
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .tertiary,
                                              ),
                                            ),
                                            Tab(
                                              text:
                                                  '${queryTabBarViewEntryClassJoinDistinctRowList.where((e) => e.isScored == true).toList().length.toString()} Completed',
                                            ),
                                          ],
                                        ),
                                      ],
                                      controller: _model.queryTabBarController,
                                      onTap: (i) async {
                                        [() async {}, () async {}][i]();
                                      },
                                    ),
                                  ),
                                  Expanded(
                                    child: TabBarView(
                                      controller: _model.queryTabBarController,
                                      children: [
                                        KeepAliveWidgetWrapper(
                                          builder: (context) => Container(
                                            width: 100.0,
                                            height: 100.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .primaryBackground,
                                            ),
                                            child: SingleChildScrollView(
                                              child: Column(
                                                mainAxisSize: MainAxisSize.max,
                                                crossAxisAlignment:
                                                    CrossAxisAlignment.center,
                                                children: [
                                                  Container(
                                                    decoration: BoxDecoration(),
                                                    child: Builder(
                                                      builder: (context) {
                                                        final chPendingCombinedSection =
                                                            queryTabBarViewEntryClassJoinDistinctRowList
                                                                .where((e) =>
                                                                    e.isScored ==
                                                                    false)
                                                                .toList()
                                                                .sortedList(
                                                                    keyOf: (e) =>
                                                                        e.sortOrder!,
                                                                    desc: false)
                                                                .toList();
                                                        if (chPendingCombinedSection
                                                            .isEmpty) {
                                                          return CEmptyEntryListPendingWidget();
                                                        }

                                                        return RefreshIndicator(
                                                          onRefresh:
                                                              () async {},
                                                          child:
                                                              ReorderableListView
                                                                  .builder(
                                                            padding: EdgeInsets
                                                                .fromLTRB(
                                                              0,
                                                              4.0,
                                                              0,
                                                              4.0,
                                                            ),
                                                            primary: false,
                                                            proxyDecorator: (Widget
                                                                        child,
                                                                    int index,
                                                                    Animation<
                                                                            double>
                                                                        animation) =>
                                                                Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    child:
                                                                        child),
                                                            shrinkWrap: true,
                                                            scrollDirection:
                                                                Axis.vertical,
                                                            itemCount:
                                                                chPendingCombinedSection
                                                                    .length,
                                                            itemBuilder: (context,
                                                                chPendingCombinedSectionIndex) {
                                                              final chPendingCombinedSectionItem =
                                                                  chPendingCombinedSection[
                                                                      chPendingCombinedSectionIndex];
                                                              return Container(
                                                                key: ValueKey(
                                                                    "ListView_1tbx3o18" +
                                                                        '_' +
                                                                        chPendingCombinedSectionIndex
                                                                            .toString()),
                                                                child:
                                                                    wrapWithModel(
                                                                  model: _model
                                                                      .cEntryCardCombinedSectionModels
                                                                      .getModel(
                                                                    'ukEntryCardCombinedSection',
                                                                    chPendingCombinedSectionIndex,
                                                                  ),
                                                                  updateCallback: () =>
                                                                      safeSetState(
                                                                          () {}),
                                                                  child:
                                                                      CEntryCardCombinedSectionWidget(
                                                                    key: Key(
                                                                      'Key1qs_${'ukEntryCardCombinedSection'}',
                                                                    ),
                                                                    cpEntryRow:
                                                                        chPendingCombinedSectionItem,
                                                                    cpClassRow:
                                                                        widget
                                                                            .ppClassRow,
                                                                    cpTrialRow:
                                                                        widget
                                                                            .ppTrialRow,
                                                                  ),
                                                                ),
                                                              );
                                                            },
                                                            onReorder: (int
                                                                    reorderableOldIndex,
                                                                int reorderableNewIndex) async {
                                                              if (FFAppState()
                                                                      .asRole !=
                                                                  'Exhibitor') {
                                                                _model.aoReorderedList =
                                                                    await actions
                                                                        .reorderItems(
                                                                  queryTabBarViewEntryClassJoinDistinctRowList
                                                                      .toList(),
                                                                  reorderableOldIndex,
                                                                  reorderableNewIndex,
                                                                );
                                                                _model.pgCounter =
                                                                    0;
                                                                // Reset sort order for all pending entries. This is done to remove completed entries.
                                                                while (_model
                                                                        .pgCounter <=
                                                                    queryTabBarViewEntryClassJoinDistinctRowList
                                                                        .length) {
                                                                  await TblEntryQueueTable()
                                                                      .update(
                                                                    data: {
                                                                      'sort_order':
                                                                          _model
                                                                              .pgCounter,
                                                                    },
                                                                    matchingRows:
                                                                        (rows) => rows
                                                                            .eqOrNull(
                                                                              'id',
                                                                              _model.aoReorderedList?.elementAtOrNull(_model.pgCounter)?.id,
                                                                            )
                                                                            .eqOrNull(
                                                                              'is_scored',
                                                                              false,
                                                                            ),
                                                                  );
                                                                  _model.pgCounter =
                                                                      _model.pgCounter +
                                                                          1;
                                                                  safeSetState(
                                                                      () {});
                                                                }
                                                                _model.pgCounter =
                                                                    0;
                                                                // Set sort order field
                                                                while (_model
                                                                        .pgCounter <=
                                                                    queryTabBarViewEntryClassJoinDistinctRowList
                                                                        .length) {
                                                                  await TblEntryQueueTable()
                                                                      .update(
                                                                    data: {
                                                                      'sort_order':
                                                                          _model.pgCounter +
                                                                              1,
                                                                    },
                                                                    matchingRows:
                                                                        (rows) =>
                                                                            rows.eqOrNull(
                                                                      'id',
                                                                      _model
                                                                          .aoReorderedList
                                                                          ?.elementAtOrNull(
                                                                              _model.pgCounter)
                                                                          ?.id,
                                                                    ),
                                                                  );
                                                                  _model.pgCounter =
                                                                      _model.pgCounter +
                                                                          1;
                                                                  safeSetState(
                                                                      () {});
                                                                }
                                                              } else {
                                                                ScaffoldMessenger.of(
                                                                        context)
                                                                    .showSnackBar(
                                                                  SnackBar(
                                                                    content:
                                                                        Text(
                                                                      'Only Trial Officials can change running order',
                                                                      style:
                                                                          TextStyle(
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .warning,
                                                                      ),
                                                                    ),
                                                                    duration: Duration(
                                                                        milliseconds:
                                                                            4000),
                                                                    backgroundColor:
                                                                        FlutterFlowTheme.of(context)
                                                                            .secondary,
                                                                  ),
                                                                );
                                                              }

                                                              safeSetState(
                                                                  () {});
                                                            },
                                                          ),
                                                        );
                                                      },
                                                    ),
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                        KeepAliveWidgetWrapper(
                                          builder: (context) => Container(
                                            width: 100.0,
                                            height: 100.0,
                                            decoration: BoxDecoration(
                                              color:
                                                  FlutterFlowTheme.of(context)
                                                      .primaryBackground,
                                            ),
                                            child: SingleChildScrollView(
                                              child: Column(
                                                mainAxisSize: MainAxisSize.max,
                                                children: [
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(8.0, 8.0,
                                                                8.0, 0.0),
                                                    child: Container(
                                                      width: double.infinity,
                                                      height: 72.0,
                                                      decoration: BoxDecoration(
                                                        color: FlutterFlowTheme
                                                                .of(context)
                                                            .secondaryBackground,
                                                        boxShadow: [
                                                          BoxShadow(
                                                            blurRadius: 5.0,
                                                            color: Color(
                                                                0x230E151B),
                                                            offset: Offset(
                                                              0.0,
                                                              2.0,
                                                            ),
                                                          )
                                                        ],
                                                        borderRadius:
                                                            BorderRadius
                                                                .circular(12.0),
                                                      ),
                                                      child: Padding(
                                                        padding:
                                                            EdgeInsets.all(4.0),
                                                        child: Column(
                                                          mainAxisSize:
                                                              MainAxisSize.max,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .spaceBetween,
                                                          crossAxisAlignment:
                                                              CrossAxisAlignment
                                                                  .start,
                                                          children: [
                                                            Row(
                                                              mainAxisSize:
                                                                  MainAxisSize
                                                                      .max,
                                                              mainAxisAlignment:
                                                                  MainAxisAlignment
                                                                      .center,
                                                              children: [
                                                                Padding(
                                                                  padding:
                                                                      EdgeInsets
                                                                          .all(
                                                                              4.0),
                                                                  child: Text(
                                                                    'Results below are Preliminary',
                                                                    style: FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMedium
                                                                        .override(
                                                                          fontFamily:
                                                                              FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                          fontSize:
                                                                              12.0,
                                                                          letterSpacing:
                                                                              0.0,
                                                                          fontWeight:
                                                                              FontWeight.normal,
                                                                          useGoogleFonts:
                                                                              !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                        ),
                                                                  ),
                                                                ),
                                                              ],
                                                            ),
                                                            Padding(
                                                              padding:
                                                                  EdgeInsets
                                                                      .all(4.0),
                                                              child: Row(
                                                                mainAxisSize:
                                                                    MainAxisSize
                                                                        .max,
                                                                mainAxisAlignment:
                                                                    MainAxisAlignment
                                                                        .center,
                                                                children: [
                                                                  FlutterFlowChoiceChips(
                                                                    options: [
                                                                      ChipData(
                                                                          'Armband'),
                                                                      ChipData(
                                                                          'Placement')
                                                                    ],
                                                                    onChanged:
                                                                        (val) async {
                                                                      safeSetState(() =>
                                                                          _model.choiceChipsSortValue =
                                                                              val?.firstOrNull);
                                                                      HapticFeedback
                                                                          .heavyImpact();
                                                                    },
                                                                    selectedChipStyle:
                                                                        ChipStyle(
                                                                      backgroundColor:
                                                                          FlutterFlowTheme.of(context)
                                                                              .backgroundComponents,
                                                                      textStyle: FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMedium
                                                                          .override(
                                                                            fontFamily:
                                                                                FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            letterSpacing:
                                                                                0.0,
                                                                            fontWeight:
                                                                                FontWeight.normal,
                                                                            useGoogleFonts:
                                                                                !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                          ),
                                                                      iconColor:
                                                                          FlutterFlowTheme.of(context)
                                                                              .primaryText,
                                                                      iconSize:
                                                                          18.0,
                                                                      elevation:
                                                                          4.0,
                                                                    ),
                                                                    unselectedChipStyle:
                                                                        ChipStyle(
                                                                      backgroundColor:
                                                                          FlutterFlowTheme.of(context)
                                                                              .accent4,
                                                                      textStyle: FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodySmall
                                                                          .override(
                                                                            fontFamily:
                                                                                FlutterFlowTheme.of(context).bodySmallFamily,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).primaryText,
                                                                            letterSpacing:
                                                                                0.0,
                                                                            useGoogleFonts:
                                                                                !FlutterFlowTheme.of(context).bodySmallIsCustom,
                                                                          ),
                                                                      iconColor:
                                                                          FlutterFlowTheme.of(context)
                                                                              .primaryText,
                                                                      iconSize:
                                                                          18.0,
                                                                      elevation:
                                                                          4.0,
                                                                    ),
                                                                    chipSpacing:
                                                                        20.0,
                                                                    rowSpacing:
                                                                        12.0,
                                                                    multiselect:
                                                                        false,
                                                                    initialized:
                                                                        _model.choiceChipsSortValue !=
                                                                            null,
                                                                    alignment:
                                                                        WrapAlignment
                                                                            .start,
                                                                    controller: _model
                                                                            .choiceChipsSortValueController ??=
                                                                        FormFieldController<
                                                                            List<String>>(
                                                                      [
                                                                        'Armband'
                                                                      ],
                                                                    ),
                                                                    wrapped:
                                                                        true,
                                                                  ),
                                                                ],
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ),
                                                    ),
                                                  ),
                                                  Column(
                                                    mainAxisSize:
                                                        MainAxisSize.max,
                                                    children: [
                                                      Container(
                                                        decoration:
                                                            BoxDecoration(),
                                                        child: Builder(
                                                          builder: (context) {
                                                            if (_model
                                                                    .choiceChipsSortValue ==
                                                                'Armband') {
                                                              return Builder(
                                                                builder:
                                                                    (context) {
                                                                  final queryCompletedArmbandVar = queryTabBarViewEntryClassJoinDistinctRowList
                                                                      .where((e) =>
                                                                          e.isScored ==
                                                                          true)
                                                                      .toList()
                                                                      .sortedList(
                                                                          keyOf: (e) => e
                                                                              .armband!,
                                                                          desc:
                                                                              false)
                                                                      .toList();
                                                                  if (queryCompletedArmbandVar
                                                                      .isEmpty) {
                                                                    return CEmptyListWidget();
                                                                  }

                                                                  return RefreshIndicator(
                                                                    key: Key(
                                                                        'RefreshIndicator_plcnwe66'),
                                                                    onRefresh:
                                                                        () async {
                                                                      safeSetState(() =>
                                                                          _model.requestCompleter =
                                                                              null);
                                                                      await _model
                                                                          .waitForRequestCompleted();
                                                                    },
                                                                    child: ListView
                                                                        .separated(
                                                                      padding: EdgeInsets.symmetric(
                                                                          vertical:
                                                                              4.0),
                                                                      primary:
                                                                          false,
                                                                      shrinkWrap:
                                                                          true,
                                                                      scrollDirection:
                                                                          Axis.vertical,
                                                                      itemCount:
                                                                          queryCompletedArmbandVar
                                                                              .length,
                                                                      separatorBuilder: (_,
                                                                              __) =>
                                                                          SizedBox(
                                                                              height: 4.0),
                                                                      itemBuilder:
                                                                          (context,
                                                                              queryCompletedArmbandVarIndex) {
                                                                        final queryCompletedArmbandVarItem =
                                                                            queryCompletedArmbandVar[queryCompletedArmbandVarIndex];
                                                                        return Padding(
                                                                          padding: EdgeInsetsDirectional.fromSTEB(
                                                                              8.0,
                                                                              0.0,
                                                                              8.0,
                                                                              0.0),
                                                                          child:
                                                                              Material(
                                                                            color:
                                                                                Colors.transparent,
                                                                            elevation:
                                                                                3.0,
                                                                            shape:
                                                                                RoundedRectangleBorder(
                                                                              borderRadius: BorderRadius.circular(12.0),
                                                                            ),
                                                                            child:
                                                                                Container(
                                                                              width: double.infinity,
                                                                              decoration: BoxDecoration(
                                                                                color: FlutterFlowTheme.of(context).secondaryBackground,
                                                                                boxShadow: [
                                                                                  BoxShadow(
                                                                                    color: Color(0x230E151B),
                                                                                    offset: Offset(
                                                                                      0.0,
                                                                                      2.0,
                                                                                    ),
                                                                                  )
                                                                                ],
                                                                                borderRadius: BorderRadius.circular(12.0),
                                                                              ),
                                                                              child: Column(
                                                                                mainAxisSize: MainAxisSize.min,
                                                                                mainAxisAlignment: MainAxisAlignment.center,
                                                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                                                children: [
                                                                                  Row(
                                                                                    mainAxisSize: MainAxisSize.min,
                                                                                    mainAxisAlignment: MainAxisAlignment.start,
                                                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                                                    children: [
                                                                                      if (FFAppState().asOrg == 'AKC FastCat')
                                                                                        Padding(
                                                                                          padding: EdgeInsets.all(8.0),
                                                                                          child: Material(
                                                                                            color: Colors.transparent,
                                                                                            elevation: 1.0,
                                                                                            shape: const CircleBorder(),
                                                                                            child: Container(
                                                                                              width: 50.0,
                                                                                              height: 50.0,
                                                                                              decoration: BoxDecoration(
                                                                                                color: FlutterFlowTheme.of(context).secondary,
                                                                                                shape: BoxShape.circle,
                                                                                              ),
                                                                                              alignment: AlignmentDirectional(0.0, 0.1),
                                                                                              child: Text(
                                                                                                valueOrDefault<String>(
                                                                                                  queryCompletedArmbandVarItem.armband?.toString(),
                                                                                                  'Armband',
                                                                                                ),
                                                                                                textAlign: TextAlign.center,
                                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                      color: FlutterFlowTheme.of(context).colorWhite,
                                                                                                      fontSize: 20.0,
                                                                                                      letterSpacing: 0.0,
                                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                    ),
                                                                                              ),
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      if (FFAppState().asOrg != 'AKC FastCat')
                                                                                        Container(
                                                                                          width: 70.0,
                                                                                          height: 70.0,
                                                                                          decoration: BoxDecoration(
                                                                                            shape: BoxShape.circle,
                                                                                          ),
                                                                                          alignment: AlignmentDirectional(0.0, 0.0),
                                                                                          child: Visibility(
                                                                                            visible: (FFAppState().asRole == 'Exhibitor') && (queryCompletedArmbandVarItem.realtimeResults == false) ? false : true,
                                                                                            child: badges.Badge(
                                                                                              badgeContent: Text(
                                                                                                functions.getPlacementText(queryCompletedArmbandVarItem.placement!),
                                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                      color: queryCompletedArmbandVarItem.placement == 4 ? FlutterFlowTheme.of(context).black600 : FlutterFlowTheme.of(context).colorWhite,
                                                                                                      fontSize: 12.0,
                                                                                                      letterSpacing: 0.0,
                                                                                                      fontWeight: FontWeight.normal,
                                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                    ),
                                                                                              ),
                                                                                              showBadge: true,
                                                                                              shape: badges.BadgeShape.circle,
                                                                                              badgeColor: functions.getPlacementColor(queryCompletedArmbandVarItem.placement!, FFAppState().asIsAKC),
                                                                                              elevation: 4.0,
                                                                                              padding: EdgeInsets.all(18.0),
                                                                                              position: badges.BadgePosition.topStart(),
                                                                                              animationType: badges.BadgeAnimationType.scale,
                                                                                              toAnimate: true,
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      Expanded(
                                                                                        child: Padding(
                                                                                          padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 4.0, 0.0),
                                                                                          child: Column(
                                                                                            mainAxisSize: MainAxisSize.max,
                                                                                            mainAxisAlignment: MainAxisAlignment.center,
                                                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                                                            children: [
                                                                                              Padding(
                                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 8.0, 0.0, 4.0),
                                                                                                child: Row(
                                                                                                  mainAxisSize: MainAxisSize.max,
                                                                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                                                                  crossAxisAlignment: CrossAxisAlignment.center,
                                                                                                  children: [
                                                                                                    if (FFAppState().asOrg != 'AKC FastCat')
                                                                                                      Text(
                                                                                                        '${valueOrDefault<String>(
                                                                                                          queryCompletedArmbandVarItem.armband?.toString(),
                                                                                                          '0',
                                                                                                        )} - ',
                                                                                                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                              letterSpacing: 0.0,
                                                                                                              fontWeight: FontWeight.w500,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                    Expanded(
                                                                                                      child: Text(
                                                                                                        valueOrDefault<String>(
                                                                                                          queryCompletedArmbandVarItem.callName,
                                                                                                          'Call Name',
                                                                                                        ),
                                                                                                        style: FlutterFlowTheme.of(context).titleMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).titleMediumFamily,
                                                                                                              fontSize: 14.0,
                                                                                                              letterSpacing: 0.0,
                                                                                                              fontWeight: FontWeight.w500,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).titleMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                    ),
                                                                                                    if (FFAppState().asOrg == 'AKC FastCat')
                                                                                                      Padding(
                                                                                                        padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 4.0, 0.0),
                                                                                                        child: Text(
                                                                                                          'Block: ${valueOrDefault<String>(
                                                                                                            queryCompletedArmbandVarItem.fastcatBlock,
                                                                                                            'Block',
                                                                                                          )}',
                                                                                                          style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                color: FlutterFlowTheme.of(context).secondaryText,
                                                                                                                fontSize: 12.0,
                                                                                                                letterSpacing: 0.0,
                                                                                                                fontWeight: FontWeight.w500,
                                                                                                                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                              ),
                                                                                                        ),
                                                                                                      ),
                                                                                                  ],
                                                                                                ),
                                                                                              ),
                                                                                              Text(
                                                                                                '${queryCompletedArmbandVarItem.breed} - ${queryCompletedArmbandVarItem.handler}',
                                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                      color: FlutterFlowTheme.of(context).secondaryText,
                                                                                                      fontSize: 12.0,
                                                                                                      letterSpacing: 0.0,
                                                                                                      fontWeight: FontWeight.w500,
                                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                    ),
                                                                                              ),
                                                                                              if (valueOrDefault<bool>(
                                                                                                (FFAppState().asRole == 'Exhibitor') && (queryCompletedArmbandVarItem.realtimeResults == false) ? false : true,
                                                                                                false,
                                                                                              ))
                                                                                                Padding(
                                                                                                  padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 8.0),
                                                                                                  child: Row(
                                                                                                    mainAxisSize: MainAxisSize.max,
                                                                                                    mainAxisAlignment: MainAxisAlignment.start,
                                                                                                    children: [
                                                                                                      if (!functions.elementImageCompare(queryCompletedArmbandVarItem.section, '-'))
                                                                                                        Padding(
                                                                                                          padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 4.0, 0.0),
                                                                                                          child: badges.Badge(
                                                                                                            badgeContent: Text(
                                                                                                              queryCompletedArmbandVarItem.section!,
                                                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                                                    fontSize: 10.0,
                                                                                                                    letterSpacing: 0.0,
                                                                                                                    fontWeight: FontWeight.normal,
                                                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                                  ),
                                                                                                            ),
                                                                                                            showBadge: true,
                                                                                                            shape: badges.BadgeShape.circle,
                                                                                                            badgeColor: FlutterFlowTheme.of(context).secondary,
                                                                                                            elevation: 1.0,
                                                                                                            padding: EdgeInsets.all(4.0),
                                                                                                            position: badges.BadgePosition.topStart(),
                                                                                                            animationType: badges.BadgeAnimationType.scale,
                                                                                                            toAnimate: true,
                                                                                                          ),
                                                                                                        ),
                                                                                                      Text(
                                                                                                        '${valueOrDefault<String>(
                                                                                                          queryCompletedArmbandVarItem.resultText,
                                                                                                          'None',
                                                                                                        )} - Time: ${valueOrDefault<String>(
                                                                                                          queryCompletedArmbandVarItem.searchTime,
                                                                                                          '0',
                                                                                                        )}',
                                                                                                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                              fontSize: 12.0,
                                                                                                              letterSpacing: 0.0,
                                                                                                              fontWeight: FontWeight.w500,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                      if (FFAppState().asOrg != 'AKC FastCat')
                                                                                                        Padding(
                                                                                                          padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 0.0, 0.0),
                                                                                                          child: Text(
                                                                                                            'Faults: ${queryCompletedArmbandVarItem.faultCount?.toString()}',
                                                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                  fontSize: 12.0,
                                                                                                                  letterSpacing: 0.0,
                                                                                                                  fontWeight: FontWeight.w500,
                                                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                                ),
                                                                                                          ),
                                                                                                        ),
                                                                                                    ],
                                                                                                  ),
                                                                                                ),
                                                                                            ],
                                                                                          ),
                                                                                        ),
                                                                                      ),
                                                                                      Column(
                                                                                        mainAxisSize: MainAxisSize.max,
                                                                                        children: [
                                                                                          if (FFAppState().asRole != 'Exhibitor')
                                                                                            Builder(
                                                                                              builder: (context) => FlutterFlowIconButton(
                                                                                                borderColor: Colors.transparent,
                                                                                                borderRadius: 30.0,
                                                                                                borderWidth: 1.0,
                                                                                                buttonSize: 50.0,
                                                                                                icon: FaIcon(
                                                                                                  FontAwesomeIcons.ellipsisV,
                                                                                                  color: FlutterFlowTheme.of(context).primaryText,
                                                                                                  size: 20.0,
                                                                                                ),
                                                                                                onPressed: () async {
                                                                                                  HapticFeedback.heavyImpact();
                                                                                                  await showDialog(
                                                                                                    context: context,
                                                                                                    builder: (dialogContext) {
                                                                                                      return Dialog(
                                                                                                        elevation: 0,
                                                                                                        insetPadding: EdgeInsets.zero,
                                                                                                        backgroundColor: Colors.transparent,
                                                                                                        alignment: AlignmentDirectional(0.0, 0.0).resolve(Directionality.of(context)),
                                                                                                        child: GestureDetector(
                                                                                                          onTap: () {
                                                                                                            FocusScope.of(dialogContext).unfocus();
                                                                                                            FocusManager.instance.primaryFocus?.unfocus();
                                                                                                          },
                                                                                                          child: CConfirmMoveToPendingCombinedSectionWidget(
                                                                                                            cpEntryRow: queryCompletedArmbandVarItem,
                                                                                                            cpClassRow: widget.ppClassRow,
                                                                                                            cpTrialRow: widget.ppTrialRow,
                                                                                                          ),
                                                                                                        ),
                                                                                                      );
                                                                                                    },
                                                                                                  );
                                                                                                },
                                                                                              ),
                                                                                            ),
                                                                                        ],
                                                                                      ),
                                                                                    ],
                                                                                  ),
                                                                                ],
                                                                              ),
                                                                            ),
                                                                          ),
                                                                        );
                                                                      },
                                                                    ),
                                                                  );
                                                                },
                                                              );
                                                            } else if (_model
                                                                    .choiceChipsSortValue ==
                                                                'Placement') {
                                                              return Builder(
                                                                builder:
                                                                    (context) {
                                                                  final queryCompletedPlacementVar = queryTabBarViewEntryClassJoinDistinctRowList
                                                                      .where((e) =>
                                                                          e.isScored ==
                                                                          true)
                                                                      .toList()
                                                                      .sortedList(
                                                                          keyOf: (e) => e
                                                                              .placement!,
                                                                          desc:
                                                                              false)
                                                                      .toList();
                                                                  if (queryCompletedPlacementVar
                                                                      .isEmpty) {
                                                                    return CEmptyEntryListCompletedWidget();
                                                                  }

                                                                  return RefreshIndicator(
                                                                    key: Key(
                                                                        'RefreshIndicator_6svgjzfj'),
                                                                    onRefresh:
                                                                        () async {
                                                                      safeSetState(() =>
                                                                          _model.requestCompleter =
                                                                              null);
                                                                      await _model
                                                                          .waitForRequestCompleted();
                                                                    },
                                                                    child: ListView
                                                                        .separated(
                                                                      padding: EdgeInsets.symmetric(
                                                                          vertical:
                                                                              4.0),
                                                                      primary:
                                                                          false,
                                                                      shrinkWrap:
                                                                          true,
                                                                      scrollDirection:
                                                                          Axis.vertical,
                                                                      itemCount:
                                                                          queryCompletedPlacementVar
                                                                              .length,
                                                                      separatorBuilder: (_,
                                                                              __) =>
                                                                          SizedBox(
                                                                              height: 4.0),
                                                                      itemBuilder:
                                                                          (context,
                                                                              queryCompletedPlacementVarIndex) {
                                                                        final queryCompletedPlacementVarItem =
                                                                            queryCompletedPlacementVar[queryCompletedPlacementVarIndex];
                                                                        return Padding(
                                                                          padding: EdgeInsetsDirectional.fromSTEB(
                                                                              8.0,
                                                                              0.0,
                                                                              8.0,
                                                                              0.0),
                                                                          child:
                                                                              Material(
                                                                            color:
                                                                                Colors.transparent,
                                                                            elevation:
                                                                                3.0,
                                                                            shape:
                                                                                RoundedRectangleBorder(
                                                                              borderRadius: BorderRadius.circular(12.0),
                                                                            ),
                                                                            child:
                                                                                Container(
                                                                              width: double.infinity,
                                                                              decoration: BoxDecoration(
                                                                                color: FlutterFlowTheme.of(context).secondaryBackground,
                                                                                boxShadow: [
                                                                                  BoxShadow(
                                                                                    color: Color(0x230E151B),
                                                                                    offset: Offset(
                                                                                      0.0,
                                                                                      2.0,
                                                                                    ),
                                                                                  )
                                                                                ],
                                                                                borderRadius: BorderRadius.circular(12.0),
                                                                              ),
                                                                              child: Column(
                                                                                mainAxisSize: MainAxisSize.min,
                                                                                mainAxisAlignment: MainAxisAlignment.center,
                                                                                crossAxisAlignment: CrossAxisAlignment.start,
                                                                                children: [
                                                                                  Row(
                                                                                    mainAxisSize: MainAxisSize.min,
                                                                                    mainAxisAlignment: MainAxisAlignment.start,
                                                                                    crossAxisAlignment: CrossAxisAlignment.start,
                                                                                    children: [
                                                                                      if (FFAppState().asOrg == 'AKC FastCat')
                                                                                        Padding(
                                                                                          padding: EdgeInsets.all(8.0),
                                                                                          child: Material(
                                                                                            color: Colors.transparent,
                                                                                            elevation: 1.0,
                                                                                            shape: const CircleBorder(),
                                                                                            child: Container(
                                                                                              width: 50.0,
                                                                                              height: 50.0,
                                                                                              decoration: BoxDecoration(
                                                                                                color: FlutterFlowTheme.of(context).secondary,
                                                                                                shape: BoxShape.circle,
                                                                                              ),
                                                                                              alignment: AlignmentDirectional(0.0, 0.1),
                                                                                              child: Text(
                                                                                                valueOrDefault<String>(
                                                                                                  queryCompletedPlacementVarItem.armband?.toString(),
                                                                                                  'Armband',
                                                                                                ),
                                                                                                textAlign: TextAlign.center,
                                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                      color: FlutterFlowTheme.of(context).colorWhite,
                                                                                                      fontSize: 20.0,
                                                                                                      letterSpacing: 0.0,
                                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                    ),
                                                                                              ),
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      if (FFAppState().asOrg != 'AKC FastCat')
                                                                                        Align(
                                                                                          alignment: AlignmentDirectional(0.0, 0.0),
                                                                                          child: Container(
                                                                                            width: 70.0,
                                                                                            height: 70.0,
                                                                                            decoration: BoxDecoration(
                                                                                              shape: BoxShape.circle,
                                                                                            ),
                                                                                            alignment: AlignmentDirectional(0.0, 0.0),
                                                                                            child: Visibility(
                                                                                              visible: (FFAppState().asRole == 'Exhibitor') && (queryCompletedPlacementVarItem.realtimeResults == false) ? false : true,
                                                                                              child: badges.Badge(
                                                                                                badgeContent: Text(
                                                                                                  functions.getPlacementText(queryCompletedPlacementVarItem.placement!),
                                                                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                        fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                        color: queryCompletedPlacementVarItem.placement == 4 ? FlutterFlowTheme.of(context).black600 : FlutterFlowTheme.of(context).colorWhite,
                                                                                                        fontSize: 12.0,
                                                                                                        letterSpacing: 0.0,
                                                                                                        fontWeight: FontWeight.normal,
                                                                                                        useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                      ),
                                                                                                ),
                                                                                                showBadge: true,
                                                                                                shape: badges.BadgeShape.circle,
                                                                                                badgeColor: functions.getPlacementColor(queryCompletedPlacementVarItem.placement!, FFAppState().asIsAKC),
                                                                                                elevation: 4.0,
                                                                                                padding: EdgeInsets.all(18.0),
                                                                                                position: badges.BadgePosition.topStart(),
                                                                                                animationType: badges.BadgeAnimationType.scale,
                                                                                                toAnimate: true,
                                                                                              ),
                                                                                            ),
                                                                                          ),
                                                                                        ),
                                                                                      Expanded(
                                                                                        child: Padding(
                                                                                          padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 4.0, 0.0),
                                                                                          child: Column(
                                                                                            mainAxisSize: MainAxisSize.max,
                                                                                            mainAxisAlignment: MainAxisAlignment.center,
                                                                                            crossAxisAlignment: CrossAxisAlignment.start,
                                                                                            children: [
                                                                                              Padding(
                                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 8.0, 0.0, 4.0),
                                                                                                child: Row(
                                                                                                  mainAxisSize: MainAxisSize.min,
                                                                                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                                                                                  crossAxisAlignment: CrossAxisAlignment.center,
                                                                                                  children: [
                                                                                                    if (FFAppState().asOrg != 'AKC FastCat')
                                                                                                      Text(
                                                                                                        '${valueOrDefault<String>(
                                                                                                          queryCompletedPlacementVarItem.armband?.toString(),
                                                                                                          '0',
                                                                                                        )} - ',
                                                                                                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                              letterSpacing: 0.0,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                    Expanded(
                                                                                                      child: Text(
                                                                                                        valueOrDefault<String>(
                                                                                                          queryCompletedPlacementVarItem.callName,
                                                                                                          'Call Name',
                                                                                                        ),
                                                                                                        style: FlutterFlowTheme.of(context).titleMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).titleMediumFamily,
                                                                                                              fontSize: 14.0,
                                                                                                              letterSpacing: 0.0,
                                                                                                              fontWeight: FontWeight.w500,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).titleMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                    ),
                                                                                                    if (FFAppState().asOrg == 'AKC FastCat')
                                                                                                      Padding(
                                                                                                        padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 4.0, 0.0),
                                                                                                        child: Text(
                                                                                                          'Block: ${valueOrDefault<String>(
                                                                                                            queryCompletedPlacementVarItem.fastcatBlock,
                                                                                                            'Block',
                                                                                                          )}',
                                                                                                          style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                color: FlutterFlowTheme.of(context).secondaryText,
                                                                                                                fontSize: 12.0,
                                                                                                                letterSpacing: 0.0,
                                                                                                                fontWeight: FontWeight.w500,
                                                                                                                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                              ),
                                                                                                        ),
                                                                                                      ),
                                                                                                  ],
                                                                                                ),
                                                                                              ),
                                                                                              Text(
                                                                                                '${queryCompletedPlacementVarItem.breed} - ${queryCompletedPlacementVarItem.handler}',
                                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                      color: FlutterFlowTheme.of(context).secondaryText,
                                                                                                      fontSize: 12.0,
                                                                                                      letterSpacing: 0.0,
                                                                                                      fontWeight: FontWeight.w500,
                                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                    ),
                                                                                              ),
                                                                                              if ((FFAppState().asRole == 'Exhibitor') && (queryCompletedPlacementVarItem.realtimeResults == false) ? false : true)
                                                                                                Padding(
                                                                                                  padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 8.0),
                                                                                                  child: Row(
                                                                                                    mainAxisSize: MainAxisSize.max,
                                                                                                    mainAxisAlignment: MainAxisAlignment.start,
                                                                                                    children: [
                                                                                                      if (widget.ppClassRow?.level == 'Novice')
                                                                                                        Padding(
                                                                                                          padding: EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 4.0, 0.0),
                                                                                                          child: badges.Badge(
                                                                                                            badgeContent: Text(
                                                                                                              queryCompletedPlacementVarItem.section!,
                                                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                                                    fontSize: 10.0,
                                                                                                                    letterSpacing: 0.0,
                                                                                                                    fontWeight: FontWeight.normal,
                                                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                                  ),
                                                                                                            ),
                                                                                                            showBadge: true,
                                                                                                            shape: badges.BadgeShape.circle,
                                                                                                            badgeColor: FlutterFlowTheme.of(context).secondary,
                                                                                                            elevation: 1.0,
                                                                                                            padding: EdgeInsets.all(4.0),
                                                                                                            position: badges.BadgePosition.topStart(),
                                                                                                            animationType: badges.BadgeAnimationType.scale,
                                                                                                            toAnimate: true,
                                                                                                          ),
                                                                                                        ),
                                                                                                      Text(
                                                                                                        '${valueOrDefault<String>(
                                                                                                          queryCompletedPlacementVarItem.resultText,
                                                                                                          'None',
                                                                                                        )} -  Time: ${valueOrDefault<String>(
                                                                                                          queryCompletedPlacementVarItem.searchTime,
                                                                                                          '0',
                                                                                                        )}',
                                                                                                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                              fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                              fontSize: 12.0,
                                                                                                              letterSpacing: 0.0,
                                                                                                              fontWeight: FontWeight.w500,
                                                                                                              useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                            ),
                                                                                                      ),
                                                                                                      if (FFAppState().asOrg != 'AKC FastCat')
                                                                                                        Padding(
                                                                                                          padding: EdgeInsetsDirectional.fromSTEB(8.0, 0.0, 0.0, 0.0),
                                                                                                          child: Text(
                                                                                                            '  Faults: ${queryCompletedPlacementVarItem.faultCount?.toString()}',
                                                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                                                  fontSize: 12.0,
                                                                                                                  letterSpacing: 0.0,
                                                                                                                  fontWeight: FontWeight.w500,
                                                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                                                ),
                                                                                                          ),
                                                                                                        ),
                                                                                                    ],
                                                                                                  ),
                                                                                                ),
                                                                                            ],
                                                                                          ),
                                                                                        ),
                                                                                      ),
                                                                                      Column(
                                                                                        mainAxisSize: MainAxisSize.max,
                                                                                        children: [
                                                                                          if (FFAppState().asRole != 'Exhibitor')
                                                                                            Builder(
                                                                                              builder: (context) => FlutterFlowIconButton(
                                                                                                borderColor: Colors.transparent,
                                                                                                borderRadius: 30.0,
                                                                                                borderWidth: 1.0,
                                                                                                buttonSize: 50.0,
                                                                                                icon: FaIcon(
                                                                                                  FontAwesomeIcons.ellipsisV,
                                                                                                  color: FlutterFlowTheme.of(context).primaryText,
                                                                                                  size: 20.0,
                                                                                                ),
                                                                                                onPressed: () async {
                                                                                                  HapticFeedback.heavyImpact();
                                                                                                  await showDialog(
                                                                                                    context: context,
                                                                                                    builder: (dialogContext) {
                                                                                                      return Dialog(
                                                                                                        elevation: 0,
                                                                                                        insetPadding: EdgeInsets.zero,
                                                                                                        backgroundColor: Colors.transparent,
                                                                                                        alignment: AlignmentDirectional(0.0, 0.0).resolve(Directionality.of(context)),
                                                                                                        child: GestureDetector(
                                                                                                          onTap: () {
                                                                                                            FocusScope.of(dialogContext).unfocus();
                                                                                                            FocusManager.instance.primaryFocus?.unfocus();
                                                                                                          },
                                                                                                          child: CConfirmMoveToPendingCombinedSectionWidget(
                                                                                                            cpEntryRow: queryCompletedPlacementVarItem,
                                                                                                            cpClassRow: widget.ppClassRow,
                                                                                                            cpTrialRow: widget.ppTrialRow,
                                                                                                          ),
                                                                                                        ),
                                                                                                      );
                                                                                                    },
                                                                                                  );
                                                                                                },
                                                                                              ),
                                                                                            ),
                                                                                        ],
                                                                                      ),
                                                                                    ],
                                                                                  ),
                                                                                ],
                                                                              ),
                                                                            ),
                                                                          ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!),
                                                                        );
                                                                      },
                                                                    ),
                                                                  );
                                                                },
                                                              );
                                                            } else {
                                                              return Row(
                                                                mainAxisSize:
                                                                    MainAxisSize
                                                                        .max,
                                                                children: [],
                                                              );
                                                            }
                                                          },
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ],
                                              ),
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              );
                            },
                          ),
                        ),
                      ].addToEnd(SizedBox(
                          height: MediaQuery.sizeOf(context).width <
                                  kBreakpointSmall
                              ? 72.0
                              : 16.0)),
                    ),
                  ),
                ),
                Align(
                  alignment: AlignmentDirectional(0.0, 1.0),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(
                      cpSelectedPageIndex: 12,
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
