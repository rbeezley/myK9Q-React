import '/backend/supabase/supabase.dart';
import '/components/c_alert_dialog_warning/c_alert_dialog_warning_widget.dart';
import '/components/c_check_in_entry_list_all/c_check_in_entry_list_all_widget.dart';
import '/components/c_check_in_entry_list_all_with_section/c_check_in_entry_list_all_with_section_widget.dart';
import '/components/c_empty_entry_list_for_dog/c_empty_entry_list_for_dog_widget.dart';
import '/components/c_loading_entries/c_loading_entries_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'dart:async';
import 'package:badges/badges.dart' as badges;
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'p_entry_list_all_model.dart';
export 'p_entry_list_all_model.dart';

class PEntryListAllWidget extends StatefulWidget {
  const PEntryListAllWidget({
    super.key,
    required this.ppArmband,
    this.ppCallName,
    this.ppBreed,
    this.ppHandler,
  });

  final int? ppArmband;
  final String? ppCallName;
  final String? ppBreed;
  final String? ppHandler;

  static String routeName = 'p_EntryListAll';
  static String routePath = '/pEntryListAll';

  @override
  State<PEntryListAllWidget> createState() => _PEntryListAllWidgetState();
}

class _PEntryListAllWidgetState extends State<PEntryListAllWidget>
    with TickerProviderStateMixin {
  late PEntryListAllModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  final animationsMap = <String, AnimationInfo>{};

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PEntryListAllModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_EntryListAll';
      safeSetState(() {});
      await actions.unsubscribe(
        'tbl_entry_queue',
      );
      await actions.unsubscribe(
        'tbl_announcements',
      );
      await Future.delayed(
        Duration(
          milliseconds: 1000,
        ),
      );
      await actions.subscribe(
        'tbl_entry_queue',
        () async {
          if (FFAppState().asOrg == 'UKC Obedience') {
            safeSetState(() => _model.requestCompleter2 = null);
            await _model.waitForRequestCompleted2();
          } else {
            safeSetState(() => _model.requestCompleter1 = null);
            await _model.waitForRequestCompleted1();
          }
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

    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: null,
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
              widget.ppCallName!,
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
                  child: Container(
                    width: double.infinity,
                    height: double.infinity,
                    constraints: BoxConstraints(
                      maxWidth: 479.0,
                    ),
                    decoration: BoxDecoration(
                      color: FlutterFlowTheme.of(context).primaryBackground,
                    ),
                    child: SingleChildScrollView(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                8.0, 8.0, 8.0, 0.0),
                            child: Material(
                              color: Colors.transparent,
                              elevation: 1.0,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8.0),
                              ),
                              child: Container(
                                width: double.infinity,
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryBackground,
                                  borderRadius: BorderRadius.circular(8.0),
                                  border: Border.all(
                                    color: FlutterFlowTheme.of(context)
                                        .secondaryBackground,
                                    width: 2.0,
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          8.0, 4.0, 8.0, 4.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.max,
                                        mainAxisAlignment:
                                            MainAxisAlignment.start,
                                        children: [
                                          Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 0.0, 8.0, 0.0),
                                            child: Container(
                                              width: 60.0,
                                              height: 60.0,
                                              decoration: BoxDecoration(
                                                color:
                                                    FlutterFlowTheme.of(context)
                                                        .secondary,
                                                shape: BoxShape.circle,
                                              ),
                                              alignment: AlignmentDirectional(
                                                  0.0, 0.1),
                                              child: Text(
                                                valueOrDefault<String>(
                                                  widget.ppArmband?.toString(),
                                                  '0',
                                                ),
                                                textAlign: TextAlign.center,
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .colorWhite,
                                                      fontSize: 22.0,
                                                      letterSpacing: 0.0,
                                                      useGoogleFonts:
                                                          !FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumIsCustom,
                                                    ),
                                              ),
                                            ),
                                          ),
                                          Column(
                                            mainAxisSize: MainAxisSize.max,
                                            crossAxisAlignment:
                                                CrossAxisAlignment.start,
                                            children: [
                                              Text(
                                                valueOrDefault<String>(
                                                  widget.ppCallName,
                                                  'CallName',
                                                ),
                                                textAlign: TextAlign.center,
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primaryText,
                                                      letterSpacing: 0.0,
                                                      useGoogleFonts:
                                                          !FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumIsCustom,
                                                    ),
                                              ),
                                              Text(
                                                valueOrDefault<String>(
                                                  widget.ppBreed,
                                                  'Breed',
                                                ).maybeHandleOverflow(
                                                  maxChars: 50,
                                                ),
                                                textAlign: TextAlign.center,
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .secondaryText,
                                                      fontSize: 12.0,
                                                      letterSpacing: 0.0,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                      useGoogleFonts:
                                                          !FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumIsCustom,
                                                    ),
                                              ),
                                              Text(
                                                valueOrDefault<String>(
                                                  widget.ppHandler,
                                                  'Handler',
                                                ),
                                                textAlign: TextAlign.center,
                                                style: FlutterFlowTheme.of(
                                                        context)
                                                    .bodyMedium
                                                    .override(
                                                      fontFamily:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumFamily,
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .secondaryText,
                                                      fontSize: 12.0,
                                                      letterSpacing: 0.0,
                                                      fontWeight:
                                                          FontWeight.w500,
                                                      useGoogleFonts:
                                                          !FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMediumIsCustom,
                                                    ),
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
                          Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Text(
                              'Results below are Preliminary',
                              style: FlutterFlowTheme.of(context)
                                  .bodyMedium
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyMediumFamily,
                                    fontSize: 12.0,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.w600,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyMediumIsCustom,
                                  ),
                            ),
                          ),
                          Builder(
                            builder: (context) {
                              if (FFAppState().asOrg == 'UKC Obedience') {
                                return Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      8.0, 0.0, 8.0, 0.0),
                                  child: FutureBuilder<
                                      List<
                                          ViewEntryClassJoinSectionDistinctRow>>(
                                    future: (_model.requestCompleter2 ??= Completer<
                                            List<
                                                ViewEntryClassJoinSectionDistinctRow>>()
                                          ..complete(
                                              ViewEntryClassJoinSectionDistinctTable()
                                                  .queryRows(
                                            queryFn: (q) => q
                                                .eqOrNull(
                                                  'mobile_app_lic_key',
                                                  valueOrDefault<String>(
                                                    FFAppState()
                                                        .asMobileAppLicKey,
                                                    '0',
                                                  ),
                                                )
                                                .eqOrNull(
                                                  'armband',
                                                  valueOrDefault<int>(
                                                    widget.ppArmband,
                                                    0,
                                                  ),
                                                )
                                                .order('trial_date',
                                                    ascending: true)
                                                .order('trial_number',
                                                    ascending: true)
                                                .order('element',
                                                    ascending: true)
                                                .order('level',
                                                    ascending: true),
                                          )))
                                        .future,
                                    builder: (context, snapshot) {
                                      // Customize what your widget looks like when it's loading.
                                      if (!snapshot.hasData) {
                                        return Center(
                                          child: CLoadingEntriesWidget(),
                                        );
                                      }
                                      List<ViewEntryClassJoinSectionDistinctRow>
                                          listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRowList =
                                          snapshot.data!;

                                      if (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRowList
                                          .isEmpty) {
                                        return CEmptyEntryListForDogWidget();
                                      }

                                      return RefreshIndicator(
                                        key: Key('RefreshIndicator_7dme6o1s'),
                                        onRefresh: () async {
                                          safeSetState(() =>
                                              _model.requestCompleter2 = null);
                                          await _model
                                              .waitForRequestCompleted2();
                                        },
                                        child: ListView.separated(
                                          padding: EdgeInsets.symmetric(
                                              vertical: 4.0),
                                          primary: false,
                                          scrollDirection: Axis.vertical,
                                          itemCount:
                                              listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRowList
                                                  .length,
                                          separatorBuilder: (_, __) =>
                                              SizedBox(height: 4.0),
                                          itemBuilder: (context,
                                              listViewEntriesWithSectionIndex) {
                                            final listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow =
                                                listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRowList[
                                                    listViewEntriesWithSectionIndex];
                                            return Material(
                                              color: Colors.transparent,
                                              elevation: 3.0,
                                              shape: RoundedRectangleBorder(
                                                borderRadius:
                                                    BorderRadius.circular(12.0),
                                              ),
                                              child: Container(
                                                width: double.infinity,
                                                height: 72.0,
                                                decoration: BoxDecoration(
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .secondaryBackground,
                                                  boxShadow: [
                                                    BoxShadow(
                                                      color: Color(0x230E151B),
                                                      offset: Offset(
                                                        0.0,
                                                        2.0,
                                                      ),
                                                    )
                                                  ],
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                child: Row(
                                                  mainAxisSize:
                                                      MainAxisSize.max,
                                                  children: [
                                                    Container(
                                                      width: 70.0,
                                                      height: 70.0,
                                                      decoration: BoxDecoration(
                                                        shape: BoxShape.circle,
                                                      ),
                                                      alignment:
                                                          AlignmentDirectional(
                                                              0.0, 0.0),
                                                      child: Visibility(
                                                        visible: (FFAppState()
                                                                        .asRole ==
                                                                    'Exhibitor') &&
                                                                (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                        .realtimeResults ==
                                                                    false)
                                                            ? false
                                                            : true,
                                                        child: badges.Badge(
                                                          badgeContent: Text(
                                                            functions.getPlacementText(
                                                                listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                    .placement!),
                                                            style: FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMedium
                                                                .override(
                                                                  fontFamily: FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMediumFamily,
                                                                  color: listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                              .placement ==
                                                                          4
                                                                      ? FlutterFlowTheme.of(
                                                                              context)
                                                                          .black600
                                                                      : FlutterFlowTheme.of(
                                                                              context)
                                                                          .colorWhite,
                                                                  fontSize:
                                                                      12.0,
                                                                  letterSpacing:
                                                                      0.0,
                                                                  fontWeight:
                                                                      FontWeight
                                                                          .normal,
                                                                  useGoogleFonts:
                                                                      !FlutterFlowTheme.of(
                                                                              context)
                                                                          .bodyMediumIsCustom,
                                                                ),
                                                          ),
                                                          showBadge: true,
                                                          shape: badges
                                                              .BadgeShape
                                                              .circle,
                                                          badgeColor: functions
                                                              .getPlacementColor(
                                                                  listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                      .placement!,
                                                                  FFAppState()
                                                                      .asIsAKC),
                                                          elevation: 4.0,
                                                          padding:
                                                              EdgeInsets.all(
                                                                  18.0),
                                                          position: badges
                                                                  .BadgePosition
                                                              .topEnd(),
                                                          animationType: badges
                                                              .BadgeAnimationType
                                                              .scale,
                                                          toAnimate: true,
                                                        ),
                                                      ),
                                                    ),
                                                    Expanded(
                                                      child: Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    8.0,
                                                                    0.0,
                                                                    0.0,
                                                                    0.0),
                                                        child: Column(
                                                          mainAxisSize:
                                                              MainAxisSize.max,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .center,
                                                          crossAxisAlignment:
                                                              CrossAxisAlignment
                                                                  .start,
                                                          children: [
                                                            Text(
                                                              '${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.trialDate} - ${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.trialNumber}'
                                                                  .maybeHandleOverflow(
                                                                maxChars: 45,
                                                                replacement:
                                                                    '…',
                                                              ),
                                                              style: FlutterFlowTheme
                                                                      .of(context)
                                                                  .bodyMedium
                                                                  .override(
                                                                    fontFamily:
                                                                        FlutterFlowTheme.of(context)
                                                                            .bodyMediumFamily,
                                                                    fontSize:
                                                                        12.0,
                                                                    letterSpacing:
                                                                        0.0,
                                                                    fontWeight:
                                                                        FontWeight
                                                                            .w500,
                                                                    useGoogleFonts:
                                                                        !FlutterFlowTheme.of(context)
                                                                            .bodyMediumIsCustom,
                                                                  ),
                                                            ),
                                                            Padding(
                                                              padding:
                                                                  EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          0.0,
                                                                          4.0,
                                                                          0.0,
                                                                          0.0),
                                                              child: Row(
                                                                mainAxisSize:
                                                                    MainAxisSize
                                                                        .max,
                                                                children: [
                                                                  Padding(
                                                                    padding: EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            0.0,
                                                                            0.0,
                                                                            4.0,
                                                                            0.0),
                                                                    child: Text(
                                                                      '${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.element} ${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.level}'
                                                                          .maybeHandleOverflow(
                                                                        maxChars:
                                                                            35,
                                                                        replacement:
                                                                            '…',
                                                                      ),
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
                                                                                FontWeight.w500,
                                                                            useGoogleFonts:
                                                                                !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                          ),
                                                                    ),
                                                                  ),
                                                                  if (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                          .section !=
                                                                      '-')
                                                                    Padding(
                                                                      padding: EdgeInsetsDirectional.fromSTEB(
                                                                          0.0,
                                                                          0.0,
                                                                          4.0,
                                                                          0.0),
                                                                      child:
                                                                          Text(
                                                                        listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .section!,
                                                                        style: FlutterFlowTheme.of(context)
                                                                            .bodyMedium
                                                                            .override(
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
                                                            if ((FFAppState()
                                                                            .asRole ==
                                                                        'Exhibitor') &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .realtimeResults ==
                                                                        false)
                                                                ? false
                                                                : true)
                                                              Padding(
                                                                padding:
                                                                    EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            0.0,
                                                                            4.0,
                                                                            0.0,
                                                                            0.0),
                                                                child: Row(
                                                                  mainAxisSize:
                                                                      MainAxisSize
                                                                          .max,
                                                                  mainAxisAlignment:
                                                                      MainAxisAlignment
                                                                          .start,
                                                                  children: [
                                                                    Padding(
                                                                      padding: EdgeInsetsDirectional.fromSTEB(
                                                                          0.0,
                                                                          0.0,
                                                                          8.0,
                                                                          0.0),
                                                                      child:
                                                                          Text(
                                                                        () {
                                                                          if (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.trialType ==
                                                                              'Rally') {
                                                                            return '${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.searchTime}  Score: ${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.score}';
                                                                          } else if (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.trialType ==
                                                                              'Obedience') {
                                                                            return 'Score: ${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.score}';
                                                                          } else {
                                                                            return '${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.searchTime}Faults: ${listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.faultCount?.toString()}';
                                                                          }
                                                                        }(),
                                                                        style: FlutterFlowTheme.of(context)
                                                                            .bodyMedium
                                                                            .override(
                                                                              fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                              fontSize: 12.0,
                                                                              letterSpacing: 0.0,
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
                                                    Row(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      mainAxisAlignment:
                                                          MainAxisAlignment.end,
                                                      children: [
                                                        Builder(
                                                          builder: (context) =>
                                                              InkWell(
                                                            splashColor: Colors
                                                                .transparent,
                                                            focusColor: Colors
                                                                .transparent,
                                                            hoverColor: Colors
                                                                .transparent,
                                                            highlightColor:
                                                                Colors
                                                                    .transparent,
                                                            onTap: () async {
                                                              HapticFeedback
                                                                  .heavyImpact();
                                                              if (FFAppState()
                                                                      .asRole ==
                                                                  'Exhibitor') {
                                                                if (!listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                    .selfCheckin!) {
                                                                  ScaffoldMessenger.of(
                                                                          context)
                                                                      .showSnackBar(
                                                                    SnackBar(
                                                                      content:
                                                                          Text(
                                                                        'Exhibitor Self Check-in Disabled by Secretary',
                                                                        style:
                                                                            TextStyle(
                                                                          color:
                                                                              FlutterFlowTheme.of(context).warning,
                                                                          fontWeight:
                                                                              FontWeight.w500,
                                                                          fontSize:
                                                                              14.0,
                                                                        ),
                                                                        textAlign:
                                                                            TextAlign.center,
                                                                      ),
                                                                      duration: Duration(
                                                                          milliseconds:
                                                                              4000),
                                                                      backgroundColor:
                                                                          FlutterFlowTheme.of(context)
                                                                              .secondary,
                                                                    ),
                                                                  );
                                                                  return;
                                                                }
                                                              }
                                                              await showAlignedDialog(
                                                                context:
                                                                    context,
                                                                isGlobal: false,
                                                                avoidOverflow:
                                                                    true,
                                                                targetAnchor:
                                                                    AlignmentDirectional(
                                                                            1.0,
                                                                            1.0)
                                                                        .resolve(
                                                                            Directionality.of(context)),
                                                                followerAnchor:
                                                                    AlignmentDirectional(
                                                                            0.0,
                                                                            0.0)
                                                                        .resolve(
                                                                            Directionality.of(context)),
                                                                builder:
                                                                    (dialogContext) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    child:
                                                                        GestureDetector(
                                                                      onTap:
                                                                          () {
                                                                        FocusScope.of(dialogContext)
                                                                            .unfocus();
                                                                        FocusManager
                                                                            .instance
                                                                            .primaryFocus
                                                                            ?.unfocus();
                                                                      },
                                                                      child:
                                                                          CCheckInEntryListAllWithSectionWidget(
                                                                        cpViewEntryClassRow:
                                                                            listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow,
                                                                        cpArmband:
                                                                            0,
                                                                        cpCallName:
                                                                            '',
                                                                        cpBreed:
                                                                            '',
                                                                        cpHandler:
                                                                            '',
                                                                        cpOnTapAction:
                                                                            () async {
                                                                          await TblEntryQueueTable()
                                                                              .update(
                                                                            data: {
                                                                              'checkin_status': FFAppState().asCheckinStatus,
                                                                            },
                                                                            matchingRows: (rows) =>
                                                                                rows.eqOrNull(
                                                                              'entryid',
                                                                              listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow.entryid,
                                                                            ),
                                                                          );
                                                                          safeSetState(() =>
                                                                              _model.requestCompleter2 = null);
                                                                          await _model
                                                                              .waitForRequestCompleted2();
                                                                          Navigator.pop(
                                                                              context);
                                                                        },
                                                                      ),
                                                                    ),
                                                                  );
                                                                },
                                                              );
                                                            },
                                                            child: Builder(
                                                              builder:
                                                                  (context) {
                                                                if (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                        .inRing ==
                                                                    true) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .backgroundComponents,
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            FFIcons.krunningdog,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                28.0,
                                                                          ),
                                                                          Text(
                                                                            'In ring',
                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                  color: FlutterFlowTheme.of(context).colorWhite,
                                                                                  fontSize: 10.0,
                                                                                  letterSpacing: 0.0,
                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else if ((listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .inRing ==
                                                                        false) &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .checkinStatus ==
                                                                        1)) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: Color(
                                                                            0xFF047B6A),
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            Icons.check_circle_rounded,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                20.0,
                                                                          ),
                                                                          Padding(
                                                                            padding: EdgeInsetsDirectional.fromSTEB(
                                                                                0.0,
                                                                                2.0,
                                                                                0.0,
                                                                                0.0),
                                                                            child:
                                                                                Text(
                                                                              'Checked-in',
                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                    fontSize: 10.0,
                                                                                    letterSpacing: 0.0,
                                                                                    fontWeight: FontWeight.w300,
                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                  ),
                                                                            ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else if ((listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .inRing ==
                                                                        false) &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .checkinStatus ==
                                                                        2)) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: Color(
                                                                            0xFFFFAB40),
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.min,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        crossAxisAlignment:
                                                                            CrossAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            Icons.compare_arrows_rounded,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                28.0,
                                                                          ),
                                                                          Text(
                                                                            'Conflict',
                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                  color: FlutterFlowTheme.of(context).colorWhite,
                                                                                  fontSize: 10.0,
                                                                                  letterSpacing: 0.0,
                                                                                  fontWeight: FontWeight.w300,
                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else if ((listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .inRing ==
                                                                        false) &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .checkinStatus ==
                                                                        3)) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .alternate,
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            Icons.remove_done,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                20.0,
                                                                          ),
                                                                          Padding(
                                                                            padding: EdgeInsetsDirectional.fromSTEB(
                                                                                0.0,
                                                                                2.0,
                                                                                0.0,
                                                                                0.0),
                                                                            child:
                                                                                Text(
                                                                              'Pulled',
                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                    fontSize: 10.0,
                                                                                    letterSpacing: 0.0,
                                                                                    fontWeight: FontWeight.w300,
                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                  ),
                                                                            ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else if ((listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .inRing ==
                                                                        false) &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .checkinStatus ==
                                                                        4)) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .tertiary,
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            Icons.fence,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                20.0,
                                                                          ),
                                                                          Padding(
                                                                            padding: EdgeInsetsDirectional.fromSTEB(
                                                                                0.0,
                                                                                2.0,
                                                                                0.0,
                                                                                0.0),
                                                                            child:
                                                                                Text(
                                                                              'At Gate',
                                                                              textAlign: TextAlign.center,
                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                    fontSize: 10.0,
                                                                                    letterSpacing: 0.0,
                                                                                    fontWeight: FontWeight.w300,
                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                  ),
                                                                            ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else if ((listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .inRing ==
                                                                        false) &&
                                                                    (listViewEntriesWithSectionViewEntryClassJoinSectionDistinctRow
                                                                            .checkinStatus ==
                                                                        5)) {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: Color(
                                                                            0xFF9B06EC),
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          Icon(
                                                                            Icons.move_up,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).colorWhite,
                                                                            size:
                                                                                24.0,
                                                                          ),
                                                                          Padding(
                                                                            padding: EdgeInsetsDirectional.fromSTEB(
                                                                                0.0,
                                                                                2.0,
                                                                                0.0,
                                                                                0.0),
                                                                            child:
                                                                                Text(
                                                                              'Report to Gate',
                                                                              textAlign: TextAlign.center,
                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                    color: FlutterFlowTheme.of(context).colorWhite,
                                                                                    fontSize: 10.0,
                                                                                    letterSpacing: 0.0,
                                                                                    fontWeight: FontWeight.w300,
                                                                                    useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                  ),
                                                                            ),
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                } else {
                                                                  return Material(
                                                                    color: Colors
                                                                        .transparent,
                                                                    elevation:
                                                                        1.0,
                                                                    shape:
                                                                        RoundedRectangleBorder(
                                                                      borderRadius:
                                                                          BorderRadius
                                                                              .only(
                                                                        bottomLeft:
                                                                            Radius.circular(0.0),
                                                                        bottomRight:
                                                                            Radius.circular(12.0),
                                                                        topLeft:
                                                                            Radius.circular(0.0),
                                                                        topRight:
                                                                            Radius.circular(12.0),
                                                                      ),
                                                                    ),
                                                                    child:
                                                                        Container(
                                                                      width:
                                                                          60.0,
                                                                      height: double
                                                                          .infinity,
                                                                      decoration:
                                                                          BoxDecoration(
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .accent3,
                                                                        boxShadow: [
                                                                          BoxShadow(
                                                                            blurRadius:
                                                                                4.0,
                                                                            color:
                                                                                Color(0x33000000),
                                                                            offset:
                                                                                Offset(
                                                                              0.0,
                                                                              2.0,
                                                                            ),
                                                                          )
                                                                        ],
                                                                        borderRadius:
                                                                            BorderRadius.only(
                                                                          bottomLeft:
                                                                              Radius.circular(0.0),
                                                                          bottomRight:
                                                                              Radius.circular(12.0),
                                                                          topLeft:
                                                                              Radius.circular(0.0),
                                                                          topRight:
                                                                              Radius.circular(12.0),
                                                                        ),
                                                                      ),
                                                                      child:
                                                                          Column(
                                                                        mainAxisSize:
                                                                            MainAxisSize.max,
                                                                        mainAxisAlignment:
                                                                            MainAxisAlignment.center,
                                                                        children: [
                                                                          FaIcon(
                                                                            FontAwesomeIcons.ellipsisV,
                                                                            color:
                                                                                FlutterFlowTheme.of(context).secondaryText,
                                                                            size:
                                                                                20.0,
                                                                          ),
                                                                        ],
                                                                      ),
                                                                    ),
                                                                  );
                                                                }
                                                              },
                                                            ),
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            );
                                          },
                                        ),
                                      );
                                    },
                                  ),
                                );
                              } else {
                                return Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      8.0, 0.0, 8.0, 0.0),
                                  child: FutureBuilder<
                                      List<ViewEntryClassJoinDistinctRow>>(
                                    future: (_model.requestCompleter1 ??= Completer<
                                            List<
                                                ViewEntryClassJoinDistinctRow>>()
                                          ..complete(
                                              ViewEntryClassJoinDistinctTable()
                                                  .queryRows(
                                            queryFn: (q) => q
                                                .eqOrNull(
                                                  'mobile_app_lic_key',
                                                  valueOrDefault<String>(
                                                    FFAppState()
                                                        .asMobileAppLicKey,
                                                    '0',
                                                  ),
                                                )
                                                .eqOrNull(
                                                  'armband',
                                                  valueOrDefault<int>(
                                                    widget.ppArmband,
                                                    0,
                                                  ),
                                                )
                                                .order('trial_date',
                                                    ascending: true)
                                                .order('trial_number',
                                                    ascending: true)
                                                .order('element',
                                                    ascending: true)
                                                .order('level',
                                                    ascending: true),
                                          )))
                                        .future,
                                    builder: (context, snapshot) {
                                      // Customize what your widget looks like when it's loading.
                                      if (!snapshot.hasData) {
                                        return Center(
                                          child: CLoadingEntriesWidget(),
                                        );
                                      }
                                      List<ViewEntryClassJoinDistinctRow>
                                          listViewEntriesWithOutSectionViewEntryClassJoinDistinctRowList =
                                          snapshot.data!;

                                      if (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRowList
                                          .isEmpty) {
                                        return CEmptyEntryListForDogWidget();
                                      }

                                      return RefreshIndicator(
                                        key: Key('RefreshIndicator_r7ri2jtj'),
                                        onRefresh: () async {
                                          safeSetState(() =>
                                              _model.requestCompleter1 = null);
                                          await _model
                                              .waitForRequestCompleted1();
                                        },
                                        child: ListView.separated(
                                          padding: EdgeInsets.symmetric(
                                              vertical: 4.0),
                                          primary: false,
                                          shrinkWrap: true,
                                          scrollDirection: Axis.vertical,
                                          itemCount:
                                              listViewEntriesWithOutSectionViewEntryClassJoinDistinctRowList
                                                  .length,
                                          separatorBuilder: (_, __) =>
                                              SizedBox(height: 4.0),
                                          itemBuilder: (context,
                                              listViewEntriesWithOutSectionIndex) {
                                            final listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow =
                                                listViewEntriesWithOutSectionViewEntryClassJoinDistinctRowList[
                                                    listViewEntriesWithOutSectionIndex];
                                            return Builder(
                                              builder: (context) => InkWell(
                                                splashColor: Colors.transparent,
                                                focusColor: Colors.transparent,
                                                hoverColor: Colors.transparent,
                                                highlightColor:
                                                    Colors.transparent,
                                                onTap: () async {
                                                  HapticFeedback.heavyImpact();
                                                  if (functions.isTimeLimitSet(
                                                      listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                          .areas
                                                          ?.toString(),
                                                      listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                          .timeLimit,
                                                      listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                          .timeLimit2,
                                                      listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                          .timeLimit3)) {
                                                    context.pushNamed(
                                                      PMaxTimeStopWatchWidget
                                                          .routeName,
                                                      queryParameters: {
                                                        'ppEntryRow':
                                                            serializeParam(
                                                          listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow,
                                                          ParamType.SupabaseRow,
                                                        ),
                                                      }.withoutNulls,
                                                    );

                                                    return;
                                                  } else {
                                                    await showDialog(
                                                      context: context,
                                                      builder: (dialogContext) {
                                                        return Dialog(
                                                          elevation: 0,
                                                          insetPadding:
                                                              EdgeInsets.zero,
                                                          backgroundColor:
                                                              Colors
                                                                  .transparent,
                                                          alignment: AlignmentDirectional(
                                                                  0.0, 0.0)
                                                              .resolve(
                                                                  Directionality.of(
                                                                      context)),
                                                          child:
                                                              GestureDetector(
                                                            onTap: () {
                                                              FocusScope.of(
                                                                      dialogContext)
                                                                  .unfocus();
                                                              FocusManager
                                                                  .instance
                                                                  .primaryFocus
                                                                  ?.unfocus();
                                                            },
                                                            child:
                                                                CAlertDialogWarningWidget(
                                                              cpAlertTitle:
                                                                  'Max Times Missing',
                                                              cpAlertMessage:
                                                                  'Max times must be entered by Judge to access countdown timer.',
                                                            ),
                                                          ),
                                                        );
                                                      },
                                                    );

                                                    return;
                                                  }
                                                },
                                                child: Material(
                                                  color: Colors.transparent,
                                                  elevation: 3.0,
                                                  shape: RoundedRectangleBorder(
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                  ),
                                                  child: Container(
                                                    width: double.infinity,
                                                    height: 72.0,
                                                    decoration: BoxDecoration(
                                                      color: FlutterFlowTheme
                                                              .of(context)
                                                          .secondaryBackground,
                                                      boxShadow: [
                                                        BoxShadow(
                                                          color:
                                                              Color(0x230E151B),
                                                          offset: Offset(
                                                            0.0,
                                                            2.0,
                                                          ),
                                                        )
                                                      ],
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              12.0),
                                                    ),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      children: [
                                                        Container(
                                                          width: 70.0,
                                                          height: 70.0,
                                                          decoration:
                                                              BoxDecoration(
                                                            shape:
                                                                BoxShape.circle,
                                                          ),
                                                          alignment:
                                                              AlignmentDirectional(
                                                                  0.0, 0.0),
                                                          child: Visibility(
                                                            visible: (FFAppState()
                                                                            .asRole ==
                                                                        'Exhibitor') &&
                                                                    (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                            .realtimeResults ==
                                                                        false)
                                                                ? false
                                                                : true,
                                                            child: badges.Badge(
                                                              badgeContent:
                                                                  Text(
                                                                functions.getPlacementText(
                                                                    listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                        .placement!),
                                                                style: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .override(
                                                                      fontFamily:
                                                                          FlutterFlowTheme.of(context)
                                                                              .bodyMediumFamily,
                                                                      color: listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.placement == 4
                                                                          ? FlutterFlowTheme.of(context)
                                                                              .black600
                                                                          : FlutterFlowTheme.of(context)
                                                                              .colorWhite,
                                                                      fontSize:
                                                                          12.0,
                                                                      letterSpacing:
                                                                          0.0,
                                                                      fontWeight:
                                                                          FontWeight
                                                                              .normal,
                                                                      useGoogleFonts:
                                                                          !FlutterFlowTheme.of(context)
                                                                              .bodyMediumIsCustom,
                                                                    ),
                                                              ),
                                                              showBadge: true,
                                                              shape: badges
                                                                  .BadgeShape
                                                                  .circle,
                                                              badgeColor: functions.getPlacementColor(
                                                                  listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                      .placement!,
                                                                  FFAppState()
                                                                      .asIsAKC),
                                                              elevation: 4.0,
                                                              padding:
                                                                  EdgeInsets
                                                                      .all(
                                                                          18.0),
                                                              position: badges
                                                                      .BadgePosition
                                                                  .topEnd(),
                                                              animationType: badges
                                                                  .BadgeAnimationType
                                                                  .scale,
                                                              toAnimate: true,
                                                            ),
                                                          ),
                                                        ),
                                                        Expanded(
                                                          child: Padding(
                                                            padding:
                                                                EdgeInsetsDirectional
                                                                    .fromSTEB(
                                                                        8.0,
                                                                        0.0,
                                                                        0.0,
                                                                        0.0),
                                                            child: Column(
                                                              mainAxisSize:
                                                                  MainAxisSize
                                                                      .max,
                                                              mainAxisAlignment:
                                                                  MainAxisAlignment
                                                                      .center,
                                                              crossAxisAlignment:
                                                                  CrossAxisAlignment
                                                                      .start,
                                                              children: [
                                                                Padding(
                                                                  padding: EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          0.0,
                                                                          0.0,
                                                                          8.0,
                                                                          0.0),
                                                                  child: Row(
                                                                    mainAxisSize:
                                                                        MainAxisSize
                                                                            .max,
                                                                    children: [
                                                                      Expanded(
                                                                        child:
                                                                            Text(
                                                                          '${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.trialDate} - ${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.trialNumber}'
                                                                              .maybeHandleOverflow(
                                                                            maxChars:
                                                                                45,
                                                                            replacement:
                                                                                '…',
                                                                          ),
                                                                          style: FlutterFlowTheme.of(context)
                                                                              .bodyMedium
                                                                              .override(
                                                                                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                fontSize: 12.0,
                                                                                letterSpacing: 0.0,
                                                                                fontWeight: FontWeight.w500,
                                                                                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                              ),
                                                                        ),
                                                                      ),
                                                                      Icon(
                                                                        Icons
                                                                            .watch_later_outlined,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .secondaryText,
                                                                        size:
                                                                            24.0,
                                                                      ),
                                                                    ],
                                                                  ),
                                                                ),
                                                                Padding(
                                                                  padding: EdgeInsetsDirectional
                                                                      .fromSTEB(
                                                                          0.0,
                                                                          4.0,
                                                                          0.0,
                                                                          0.0),
                                                                  child: Row(
                                                                    mainAxisSize:
                                                                        MainAxisSize
                                                                            .max,
                                                                    children: [
                                                                      Padding(
                                                                        padding: EdgeInsetsDirectional.fromSTEB(
                                                                            0.0,
                                                                            0.0,
                                                                            4.0,
                                                                            0.0),
                                                                        child:
                                                                            Text(
                                                                          '${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.element} ${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.level}'
                                                                              .maybeHandleOverflow(
                                                                            maxChars:
                                                                                35,
                                                                            replacement:
                                                                                '…',
                                                                          ),
                                                                          style: FlutterFlowTheme.of(context)
                                                                              .bodyMedium
                                                                              .override(
                                                                                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                fontSize: 12.0,
                                                                                letterSpacing: 0.0,
                                                                                fontWeight: FontWeight.w500,
                                                                                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                              ),
                                                                        ),
                                                                      ),
                                                                      if (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                              .section !=
                                                                          '-')
                                                                        Padding(
                                                                          padding: EdgeInsetsDirectional.fromSTEB(
                                                                              0.0,
                                                                              0.0,
                                                                              4.0,
                                                                              0.0),
                                                                          child:
                                                                              Text(
                                                                            listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.section!,
                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                  fontSize: 12.0,
                                                                                  letterSpacing: 0.0,
                                                                                  fontWeight: FontWeight.w500,
                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                ),
                                                                          ),
                                                                        ),
                                                                      if (FFAppState()
                                                                              .asOrg ==
                                                                          'AKC FastCat')
                                                                        Text(
                                                                          'Block: ${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.fastcatBlock}',
                                                                          style: FlutterFlowTheme.of(context)
                                                                              .bodyMedium
                                                                              .override(
                                                                                fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                fontSize: 12.0,
                                                                                letterSpacing: 0.0,
                                                                                fontWeight: FontWeight.w500,
                                                                                useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                              ),
                                                                        ),
                                                                    ],
                                                                  ),
                                                                ),
                                                                if ((FFAppState().asRole ==
                                                                            'Exhibitor') &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.realtimeResults ==
                                                                            false)
                                                                    ? false
                                                                    : true)
                                                                  Padding(
                                                                    padding: EdgeInsetsDirectional
                                                                        .fromSTEB(
                                                                            0.0,
                                                                            4.0,
                                                                            0.0,
                                                                            0.0),
                                                                    child: Row(
                                                                      mainAxisSize:
                                                                          MainAxisSize
                                                                              .max,
                                                                      mainAxisAlignment:
                                                                          MainAxisAlignment
                                                                              .start,
                                                                      children: [
                                                                        Padding(
                                                                          padding: EdgeInsetsDirectional.fromSTEB(
                                                                              0.0,
                                                                              0.0,
                                                                              8.0,
                                                                              0.0),
                                                                          child:
                                                                              Text(
                                                                            'Time: ${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.searchTime}',
                                                                            style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                  fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                  fontSize: 12.0,
                                                                                  letterSpacing: 0.0,
                                                                                  useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                ),
                                                                          ),
                                                                        ),
                                                                        if (FFAppState().asOrg !=
                                                                            'AKC FastCat')
                                                                          Padding(
                                                                            padding: EdgeInsetsDirectional.fromSTEB(
                                                                                0.0,
                                                                                0.0,
                                                                                4.0,
                                                                                0.0),
                                                                            child:
                                                                                Text(
                                                                              '  Faults: ${listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.faultCount?.toString()}',
                                                                              style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                    fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                    color: FlutterFlowTheme.of(context).secondaryText,
                                                                                    fontSize: 12.0,
                                                                                    letterSpacing: 0.0,
                                                                                    fontWeight: FontWeight.normal,
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
                                                        Row(
                                                          mainAxisSize:
                                                              MainAxisSize.max,
                                                          mainAxisAlignment:
                                                              MainAxisAlignment
                                                                  .end,
                                                          children: [
                                                            Builder(
                                                              builder:
                                                                  (context) =>
                                                                      InkWell(
                                                                splashColor: Colors
                                                                    .transparent,
                                                                focusColor: Colors
                                                                    .transparent,
                                                                hoverColor: Colors
                                                                    .transparent,
                                                                highlightColor:
                                                                    Colors
                                                                        .transparent,
                                                                onTap:
                                                                    () async {
                                                                  HapticFeedback
                                                                      .heavyImpact();
                                                                  if (FFAppState()
                                                                          .asRole ==
                                                                      'Exhibitor') {
                                                                    if (!listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                        .selfCheckin!) {
                                                                      ScaffoldMessenger.of(
                                                                              context)
                                                                          .showSnackBar(
                                                                        SnackBar(
                                                                          content:
                                                                              Text(
                                                                            'Exhibitor Self Check-in Disabled by Secretary',
                                                                            style:
                                                                                TextStyle(
                                                                              color: FlutterFlowTheme.of(context).warning,
                                                                              fontWeight: FontWeight.w500,
                                                                              fontSize: 14.0,
                                                                            ),
                                                                            textAlign:
                                                                                TextAlign.center,
                                                                          ),
                                                                          duration:
                                                                              Duration(milliseconds: 4000),
                                                                          backgroundColor:
                                                                              FlutterFlowTheme.of(context).secondary,
                                                                        ),
                                                                      );
                                                                      return;
                                                                    }
                                                                  }
                                                                  await showAlignedDialog(
                                                                    context:
                                                                        context,
                                                                    isGlobal:
                                                                        false,
                                                                    avoidOverflow:
                                                                        true,
                                                                    targetAnchor: AlignmentDirectional(
                                                                            1.0,
                                                                            0.0)
                                                                        .resolve(
                                                                            Directionality.of(context)),
                                                                    followerAnchor: AlignmentDirectional(
                                                                            1.0,
                                                                            0.0)
                                                                        .resolve(
                                                                            Directionality.of(context)),
                                                                    builder:
                                                                        (dialogContext) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        child:
                                                                            GestureDetector(
                                                                          onTap:
                                                                              () {
                                                                            FocusScope.of(dialogContext).unfocus();
                                                                            FocusManager.instance.primaryFocus?.unfocus();
                                                                          },
                                                                          child:
                                                                              CCheckInEntryListAllWidget(
                                                                            cpViewEntryClassRow:
                                                                                listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow,
                                                                          ),
                                                                        ),
                                                                      );
                                                                    },
                                                                  );
                                                                },
                                                                child: Builder(
                                                                  builder:
                                                                      (context) {
                                                                    if (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow
                                                                            .inRing ==
                                                                        true) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                FlutterFlowTheme.of(context).backgroundComponents,
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                FFIcons.krunningdog,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 28.0,
                                                                              ),
                                                                              Text(
                                                                                'In ring',
                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                      color: FlutterFlowTheme.of(context).colorWhite,
                                                                                      fontSize: 10.0,
                                                                                      letterSpacing: 0.0,
                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                    ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else if ((listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.inRing ==
                                                                            false) &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.checkinStatus ==
                                                                            1)) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                Color(0xFF047B6A),
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                Icons.check_circle_rounded,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 20.0,
                                                                              ),
                                                                              Padding(
                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 2.0, 0.0, 0.0),
                                                                                child: Text(
                                                                                  'Checked-in',
                                                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                        fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                        color: FlutterFlowTheme.of(context).colorWhite,
                                                                                        fontSize: 10.0,
                                                                                        letterSpacing: 0.0,
                                                                                        fontWeight: FontWeight.w300,
                                                                                        useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                      ),
                                                                                ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else if ((listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.inRing ==
                                                                            false) &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.checkinStatus ==
                                                                            2)) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                Color(0xFFFFAB40),
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.min,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            crossAxisAlignment:
                                                                                CrossAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                Icons.compare_arrows_rounded,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 28.0,
                                                                              ),
                                                                              Text(
                                                                                'Conflict',
                                                                                style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                      fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                      color: FlutterFlowTheme.of(context).colorWhite,
                                                                                      fontSize: 10.0,
                                                                                      letterSpacing: 0.0,
                                                                                      fontWeight: FontWeight.w300,
                                                                                      useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                    ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else if ((listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.inRing ==
                                                                            false) &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.checkinStatus ==
                                                                            3)) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                FlutterFlowTheme.of(context).alternate,
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                Icons.remove_done,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 20.0,
                                                                              ),
                                                                              Padding(
                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 2.0, 0.0, 0.0),
                                                                                child: Text(
                                                                                  'Pulled',
                                                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                        fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                        color: FlutterFlowTheme.of(context).colorWhite,
                                                                                        fontSize: 10.0,
                                                                                        letterSpacing: 0.0,
                                                                                        fontWeight: FontWeight.w300,
                                                                                        useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                      ),
                                                                                ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else if ((listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.inRing ==
                                                                            false) &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.checkinStatus ==
                                                                            4)) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                FlutterFlowTheme.of(context).tertiary,
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                Icons.fence,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 20.0,
                                                                              ),
                                                                              Padding(
                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 2.0, 0.0, 0.0),
                                                                                child: Text(
                                                                                  'At Gate',
                                                                                  textAlign: TextAlign.center,
                                                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                        fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                        color: FlutterFlowTheme.of(context).colorWhite,
                                                                                        fontSize: 10.0,
                                                                                        letterSpacing: 0.0,
                                                                                        fontWeight: FontWeight.w300,
                                                                                        useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                      ),
                                                                                ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else if ((listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.inRing ==
                                                                            false) &&
                                                                        (listViewEntriesWithOutSectionViewEntryClassJoinDistinctRow.checkinStatus ==
                                                                            5)) {
                                                                      return Material(
                                                                        color: Colors
                                                                            .transparent,
                                                                        elevation:
                                                                            1.0,
                                                                        shape:
                                                                            RoundedRectangleBorder(
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Container(
                                                                          width:
                                                                              60.0,
                                                                          height:
                                                                              double.infinity,
                                                                          decoration:
                                                                              BoxDecoration(
                                                                            color:
                                                                                Color(0xFF9B06EC),
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
                                                                            borderRadius:
                                                                                BorderRadius.only(
                                                                              bottomLeft: Radius.circular(0.0),
                                                                              bottomRight: Radius.circular(12.0),
                                                                              topLeft: Radius.circular(0.0),
                                                                              topRight: Radius.circular(12.0),
                                                                            ),
                                                                          ),
                                                                          child:
                                                                              Column(
                                                                            mainAxisSize:
                                                                                MainAxisSize.max,
                                                                            mainAxisAlignment:
                                                                                MainAxisAlignment.center,
                                                                            children: [
                                                                              Icon(
                                                                                Icons.move_up,
                                                                                color: FlutterFlowTheme.of(context).colorWhite,
                                                                                size: 24.0,
                                                                              ),
                                                                              Padding(
                                                                                padding: EdgeInsetsDirectional.fromSTEB(0.0, 2.0, 0.0, 0.0),
                                                                                child: Text(
                                                                                  'Report to Gate',
                                                                                  textAlign: TextAlign.center,
                                                                                  style: FlutterFlowTheme.of(context).bodyMedium.override(
                                                                                        fontFamily: FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                                        color: FlutterFlowTheme.of(context).colorWhite,
                                                                                        fontSize: 10.0,
                                                                                        letterSpacing: 0.0,
                                                                                        fontWeight: FontWeight.w300,
                                                                                        useGoogleFonts: !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                                      ),
                                                                                ),
                                                                              ),
                                                                            ],
                                                                          ),
                                                                        ),
                                                                      );
                                                                    } else {
                                                                      return Container(
                                                                        width:
                                                                            60.0,
                                                                        height:
                                                                            double.infinity,
                                                                        decoration:
                                                                            BoxDecoration(
                                                                          color:
                                                                              FlutterFlowTheme.of(context).secondaryBackground,
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
                                                                          borderRadius:
                                                                              BorderRadius.only(
                                                                            bottomLeft:
                                                                                Radius.circular(0.0),
                                                                            bottomRight:
                                                                                Radius.circular(12.0),
                                                                            topLeft:
                                                                                Radius.circular(0.0),
                                                                            topRight:
                                                                                Radius.circular(12.0),
                                                                          ),
                                                                        ),
                                                                        child:
                                                                            Column(
                                                                          mainAxisSize:
                                                                              MainAxisSize.max,
                                                                          mainAxisAlignment:
                                                                              MainAxisAlignment.center,
                                                                          children: [
                                                                            FaIcon(
                                                                              FontAwesomeIcons.ellipsisV,
                                                                              color: FlutterFlowTheme.of(context).secondaryText,
                                                                              size: 20.0,
                                                                            ),
                                                                          ],
                                                                        ),
                                                                      );
                                                                    }
                                                                  },
                                                                ),
                                                              ),
                                                            ),
                                                          ],
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                ),
                                              ).animateOnPageLoad(
                                                animationsMap[
                                                    'containerOnPageLoadAnimation']!,
                                                effects: [
                                                  MoveEffect(
                                                    curve: Curves.easeInOut,
                                                    delay:
                                                        (listViewEntriesWithOutSectionIndex *
                                                                100)
                                                            .ms,
                                                    duration: 600.0.ms,
                                                    begin: Offset(100.0, 0.0),
                                                    end: Offset(0.0, 0.0),
                                                  ),
                                                  FadeEffect(
                                                    curve: Curves.easeInOut,
                                                    delay: 300.0.ms,
                                                    duration: 600.0.ms,
                                                    begin: 0.0,
                                                    end: 1.0,
                                                  ),
                                                ],
                                              ),
                                            );
                                          },
                                        ),
                                      );
                                    },
                                  ),
                                );
                              }
                            },
                          ),
                        ].addToEnd(SizedBox(
                            height: MediaQuery.sizeOf(context).width <
                                    kBreakpointSmall
                                ? 72.0
                                : 16.0)),
                      ),
                    ),
                  ),
                ),
                Align(
                  alignment: AlignmentDirectional(0.0, 1.0),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(
                      cpSelectedPageIndex: 10,
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
