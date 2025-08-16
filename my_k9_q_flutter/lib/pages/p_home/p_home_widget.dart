import '/backend/supabase/supabase.dart';
import '/components/c_empty_entry_list_home/c_empty_entry_list_home_widget.dart';
import '/components/c_empty_favorites/c_empty_favorites_widget.dart';
import '/components/c_empty_list/c_empty_list_widget.dart';
import '/components/c_empty_trial_list/c_empty_trial_list_widget.dart';
import '/components/c_home_entries_card/c_home_entries_card_widget.dart';
import '/components/c_loading_entries/c_loading_entries_widget.dart';
import '/components/c_looading_trials/c_looading_trials_widget.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/form_field_controller.dart';
import '/custom_code/actions/index.dart' as actions;
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'dart:async';
import 'package:sticky_headers/sticky_headers.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:just_audio/just_audio.dart';
import 'package:provider/provider.dart';
import 'p_home_model.dart';
export 'p_home_model.dart';

class PHomeWidget extends StatefulWidget {
  const PHomeWidget({super.key});

  static String routeName = 'p_Home';
  static String routePath = '/Home';

  @override
  State<PHomeWidget> createState() => _PHomeWidgetState();
}

class _PHomeWidgetState extends State<PHomeWidget> {
  late PHomeModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PHomeModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_Home';
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
          safeSetState(() => _model.requestCompleter2 = null);
          await _model.waitForRequestCompleted2();
          safeSetState(() {
            _model.clearArmbandListCache();
            _model.requestCompleted1 = false;
          });
          await _model.waitForRequestCompleted1();
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
              borderRadius: 30.0,
              buttonSize: 60.0,
              icon: FaIcon(
                FontAwesomeIcons.handHoldingHeart,
                color: FlutterFlowTheme.of(context).colorWhite,
                size: 24.0,
              ),
              onPressed: () async {
                HapticFeedback.lightImpact();

                context.pushNamed(PDonationWidget.routeName);
              },
            ),
            title: Text(
              'Home',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: FlutterFlowTheme.of(context).colorWhite,
                    fontSize: 20.0,
                    letterSpacing: 0.0,
                    fontWeight: FontWeight.w500,
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
                  _model.clearArmbandListCache();
                  safeSetState(() => _model.requestCompleter2 = null);
                  await _model.waitForRequestCompleted2();
                  safeSetState(() {
                    _model.clearArmbandListCache();
                    _model.requestCompleted1 = false;
                  });
                  await _model.waitForRequestCompleted1();

                  safeSetState(() {});
                },
              ),
            ],
            centerTitle: true,
            elevation: 2.0,
          ),
          body: Stack(
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
                    primary: false,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        StickyHeader(
                          overlapHeaders: false,
                          header: Container(
                            width: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .primaryBackground,
                            ),
                            child: SingleChildScrollView(
                              primary: false,
                              child: Column(
                                mainAxisSize: MainAxisSize.max,
                                children: [
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        8.0, 8.0, 16.0, 8.0),
                                    child: Row(
                                      mainAxisSize: MainAxisSize.max,
                                      mainAxisAlignment:
                                          MainAxisAlignment.spaceBetween,
                                      children: [
                                        Text(
                                          FFAppState().asClubName,
                                          textAlign: TextAlign.start,
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                fontSize: 14.0,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.w600,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                        ),
                                        Text(
                                          FFAppState().asOrg,
                                          textAlign: TextAlign.start,
                                          style: FlutterFlowTheme.of(context)
                                              .bodyMedium
                                              .override(
                                                fontFamily:
                                                    FlutterFlowTheme.of(context)
                                                        .bodyMediumFamily,
                                                fontSize: 14.0,
                                                letterSpacing: 0.0,
                                                fontWeight: FontWeight.w600,
                                                useGoogleFonts:
                                                    !FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMediumIsCustom,
                                              ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Container(
                                    width: double.infinity,
                                    height: 180.0,
                                    decoration: BoxDecoration(
                                      color: FlutterFlowTheme.of(context)
                                          .primaryBackground,
                                    ),
                                    child:
                                        FutureBuilder<List<TblTrialQueueRow>>(
                                      future: (_model.requestCompleter2 ??=
                                              Completer<
                                                  List<TblTrialQueueRow>>()
                                                ..complete(TblTrialQueueTable()
                                                    .queryRows(
                                                  queryFn: (q) => q
                                                      .eqOrNull(
                                                        'mobile_app_lic_key',
                                                        FFAppState()
                                                            .asMobileAppLicKey,
                                                      )
                                                      .order('trial_date')
                                                      .order('trial_number',
                                                          ascending: true),
                                                )))
                                          .future,
                                      builder: (context, snapshot) {
                                        // Customize what your widget looks like when it's loading.
                                        if (!snapshot.hasData) {
                                          return Center(
                                            child: CLooadingTrialsWidget(),
                                          );
                                        }
                                        List<TblTrialQueueRow>
                                            listViewTrialsTblTrialQueueRowList =
                                            snapshot.data!;

                                        if (listViewTrialsTblTrialQueueRowList
                                            .isEmpty) {
                                          return CEmptyTrialListWidget();
                                        }

                                        return ListView.separated(
                                          padding: EdgeInsets.symmetric(
                                              horizontal: 8.0),
                                          scrollDirection: Axis.horizontal,
                                          itemCount:
                                              listViewTrialsTblTrialQueueRowList
                                                  .length,
                                          separatorBuilder: (_, __) =>
                                              SizedBox(width: 8.0),
                                          itemBuilder:
                                              (context, listViewTrialsIndex) {
                                            final listViewTrialsTblTrialQueueRow =
                                                listViewTrialsTblTrialQueueRowList[
                                                    listViewTrialsIndex];
                                            return InkWell(
                                              splashColor: Colors.transparent,
                                              focusColor: Colors.transparent,
                                              hoverColor: Colors.transparent,
                                              highlightColor:
                                                  Colors.transparent,
                                              onTap: () async {
                                                HapticFeedback.heavyImpact();

                                                context.pushNamed(
                                                  PClassListTabsWidget
                                                      .routeName,
                                                  queryParameters: {
                                                    'ppTrialRow':
                                                        serializeParam(
                                                      listViewTrialsTblTrialQueueRow,
                                                      ParamType.SupabaseRow,
                                                    ),
                                                  }.withoutNulls,
                                                );
                                              },
                                              child: Material(
                                                color: Colors.transparent,
                                                elevation: 1.0,
                                                shape: RoundedRectangleBorder(
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          12.0),
                                                ),
                                                child: AnimatedContainer(
                                                  duration: Duration(
                                                      milliseconds: 1100),
                                                  curve: Curves.easeInOut,
                                                  width: 160.0,
                                                  height: 160.0,
                                                  decoration: BoxDecoration(
                                                    color: FlutterFlowTheme.of(
                                                            context)
                                                        .secondaryBackground,
                                                    boxShadow: [
                                                      BoxShadow(
                                                        blurRadius: 5.0,
                                                        color:
                                                            Color(0x33000000),
                                                        offset: Offset(
                                                          0.0,
                                                          2.0,
                                                        ),
                                                      )
                                                    ],
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            12.0),
                                                    shape: BoxShape.rectangle,
                                                  ),
                                                  child: Column(
                                                    mainAxisSize:
                                                        MainAxisSize.min,
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                      Builder(
                                                        builder: (context) {
                                                          if (listViewTrialsTblTrialQueueRow
                                                                  .trialType ==
                                                              'Rally') {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/20190413-153_4388a.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (listViewTrialsTblTrialQueueRow
                                                                  .trialType ==
                                                              'Obedience') {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/tera_heeling.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  1)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/Interior1.jpeg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  2)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/Fisher.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit:
                                                                    BoxFit.fill,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  3)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/Interior2.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  4)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/containers5.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  5)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/containers4.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  6)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/containers3.jpg',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else if (functions
                                                              .isImageNumber(
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialDate,
                                                                  listViewTrialsTblTrialQueueRow
                                                                      .trialNumber,
                                                                  7)) {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .only(
                                                                bottomLeft: Radius
                                                                    .circular(
                                                                        0.0),
                                                                bottomRight: Radius
                                                                    .circular(
                                                                        0.0),
                                                                topLeft: Radius
                                                                    .circular(
                                                                        10.0),
                                                                topRight: Radius
                                                                    .circular(
                                                                        10.0),
                                                              ),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/HD1.png',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .cover,
                                                              ),
                                                            );
                                                          } else {
                                                            return ClipRRect(
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                              child:
                                                                  Image.asset(
                                                                'assets/images/myk9q_logo_text_crop.png',
                                                                width: double
                                                                    .infinity,
                                                                height: 100.0,
                                                                fit: BoxFit
                                                                    .contain,
                                                              ),
                                                            );
                                                          }
                                                        },
                                                      ),
                                                      Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    4.0,
                                                                    0.0,
                                                                    0.0),
                                                        child: Text(
                                                          valueOrDefault<
                                                              String>(
                                                            listViewTrialsTblTrialQueueRow
                                                                .trialDate,
                                                            'Trial Date',
                                                          ),
                                                          textAlign:
                                                              TextAlign.start,
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .titleMedium
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleMediumFamily,
                                                                fontSize: 10.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleMediumIsCustom,
                                                              ),
                                                        ),
                                                      ),
                                                      Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    0.0,
                                                                    0.0,
                                                                    0.0),
                                                        child: Text(
                                                          '${FFAppState().asOrg == 'UKC Obedience' ? '${listViewTrialsTblTrialQueueRow.trialNumber}  ${listViewTrialsTblTrialQueueRow.trialType}' : listViewTrialsTblTrialQueueRow.trialNumber}',
                                                          textAlign:
                                                              TextAlign.start,
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .bodyMedium
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMediumFamily,
                                                                fontSize: 10.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .w500,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMediumIsCustom,
                                                              ),
                                                        ),
                                                      ),
                                                      Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    4.0,
                                                                    0.0,
                                                                    0.0),
                                                        child: Text(
                                                          valueOrDefault<
                                                              String>(
                                                            '${listViewTrialsTblTrialQueueRow.classPendingCount.toString()} of ${listViewTrialsTblTrialQueueRow.classTotalCount.toString()} Classes  Remaining',
                                                            ' Classes  Remaining',
                                                          ),
                                                          textAlign:
                                                              TextAlign.start,
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .bodySmall
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodySmallFamily,
                                                                fontSize: 10.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .normal,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodySmallIsCustom,
                                                              ),
                                                        ),
                                                      ),
                                                      Padding(
                                                        padding:
                                                            EdgeInsetsDirectional
                                                                .fromSTEB(
                                                                    4.0,
                                                                    0.0,
                                                                    0.0,
                                                                    0.0),
                                                        child: Text(
                                                          valueOrDefault<
                                                              String>(
                                                            '${(listViewTrialsTblTrialQueueRow.entryTotalCount - listViewTrialsTblTrialQueueRow.entryCompletedCount).toString()} of ${listViewTrialsTblTrialQueueRow.entryTotalCount.toString()} Entries Remaining',
                                                            ' Entries Remaining',
                                                          ),
                                                          textAlign:
                                                              TextAlign.start,
                                                          style: FlutterFlowTheme
                                                                  .of(context)
                                                              .bodySmall
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodySmallFamily,
                                                                fontSize: 10.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                fontWeight:
                                                                    FontWeight
                                                                        .normal,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodySmallIsCustom,
                                                              ),
                                                        ),
                                                      ),
                                                    ],
                                                  ),
                                                ),
                                              ),
                                            );
                                          },
                                        );
                                      },
                                    ),
                                  ),
                                  Padding(
                                    padding: EdgeInsetsDirectional.fromSTEB(
                                        8.0, 8.0, 8.0, 0.0),
                                    child: Material(
                                      color: Colors.transparent,
                                      elevation: 3.0,
                                      shape: RoundedRectangleBorder(
                                        borderRadius:
                                            BorderRadius.circular(12.0),
                                      ),
                                      child: Container(
                                        width: double.infinity,
                                        decoration: BoxDecoration(
                                          color: FlutterFlowTheme.of(context)
                                              .secondaryBackground,
                                          borderRadius:
                                              BorderRadius.circular(12.0),
                                        ),
                                        child: Container(
                                          width: 200.0,
                                          decoration: BoxDecoration(),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.max,
                                            mainAxisAlignment:
                                                MainAxisAlignment.spaceAround,
                                            children: [
                                              Expanded(
                                                child: Padding(
                                                  padding: EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          4.0, 8.0, 4.0, 8.0),
                                                  child: FlutterFlowChoiceChips(
                                                    options: [
                                                      ChipData('Armband'),
                                                      ChipData('Name'),
                                                      ChipData('Handler'),
                                                      ChipData('Favorites')
                                                    ],
                                                    onChanged: (val) async {
                                                      safeSetState(() => _model
                                                              .choiceChipsSortValue =
                                                          val?.firstOrNull);
                                                      HapticFeedback
                                                          .heavyImpact();
                                                      safeSetState(() => _model
                                                              .requestCompleter2 =
                                                          null);
                                                      await _model
                                                          .waitForRequestCompleted2();
                                                    },
                                                    selectedChipStyle:
                                                        ChipStyle(
                                                      backgroundColor:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .backgroundComponents,
                                                      textStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
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
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMediumIsCustom,
                                                              ),
                                                      iconColor:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primaryText,
                                                      iconSize: 0.0,
                                                      elevation: 4.0,
                                                    ),
                                                    unselectedChipStyle:
                                                        ChipStyle(
                                                      backgroundColor:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .accent4,
                                                      textStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodySmall
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodySmallFamily,
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .primaryText,
                                                                letterSpacing:
                                                                    0.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodySmallIsCustom,
                                                              ),
                                                      iconColor:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .primaryText,
                                                      iconSize: 18.0,
                                                      elevation: 4.0,
                                                    ),
                                                    chipSpacing: 12.0,
                                                    rowSpacing: 8.0,
                                                    multiselect: false,
                                                    initialized: _model
                                                            .choiceChipsSortValue !=
                                                        null,
                                                    alignment:
                                                        WrapAlignment.center,
                                                    controller: _model
                                                            .choiceChipsSortValueController ??=
                                                        FormFieldController<
                                                            List<String>>(
                                                      ['Armband'],
                                                    ),
                                                    wrapped: true,
                                                  ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          content: FutureBuilder<List<ViewUniqueArmbandsRow>>(
                            future: _model
                                .armbandList(
                              requestFn: () =>
                                  ViewUniqueArmbandsTable().queryRows(
                                queryFn: (q) => q.eqOrNull(
                                  'mobile_app_lic_key',
                                  FFAppState().asMobileAppLicKey,
                                ),
                              ),
                            )
                                .then((result) {
                              _model.requestCompleted1 = true;
                              return result;
                            }),
                            builder: (context, snapshot) {
                              // Customize what your widget looks like when it's loading.
                              if (!snapshot.hasData) {
                                return CLoadingEntriesWidget();
                              }
                              List<ViewUniqueArmbandsRow>
                                  queryHomeEntriesViewUniqueArmbandsRowList =
                                  snapshot.data!;

                              return Container(
                                decoration: BoxDecoration(
                                  color: FlutterFlowTheme.of(context)
                                      .primaryBackground,
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    Align(
                                      alignment: AlignmentDirectional(1.0, 0.0),
                                      child: Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            8.0, 4.0, 8.0, 0.0),
                                        child: Container(
                                          decoration: BoxDecoration(
                                            color: FlutterFlowTheme.of(context)
                                                .primaryBackground,
                                            borderRadius:
                                                BorderRadius.circular(12.0),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.max,
                                            mainAxisAlignment:
                                                MainAxisAlignment.end,
                                            children: [
                                              Padding(
                                                padding: EdgeInsets.all(4.0),
                                                child: Text(
                                                  '${queryHomeEntriesViewUniqueArmbandsRowList.length.toString()} Dogs Entered',
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
                                                        fontSize: 10.0,
                                                        letterSpacing: 0.0,
                                                        fontWeight:
                                                            FontWeight.normal,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          8.0, 0.0, 8.0, 0.0),
                                      child: Builder(
                                        builder: (context) {
                                          if (_model.choiceChipsSortValue ==
                                              'Armband') {
                                            return Builder(
                                              builder: (context) {
                                                final armbandChildren =
                                                    queryHomeEntriesViewUniqueArmbandsRowList
                                                        .sortedList(
                                                            keyOf: (e) =>
                                                                e.armband!,
                                                            desc: false)
                                                        .toList();
                                                if (armbandChildren.isEmpty) {
                                                  return CEmptyEntryListHomeWidget();
                                                }

                                                return RefreshIndicator(
                                                  key: Key(
                                                      'RefreshIndicator_27lbi8gz'),
                                                  onRefresh: () async {
                                                    safeSetState(() {
                                                      _model
                                                          .clearArmbandListCache();
                                                      _model.requestCompleted1 =
                                                          false;
                                                    });
                                                    await _model
                                                        .waitForRequestCompleted1();
                                                  },
                                                  child: ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 4.0),
                                                    primary: false,
                                                    shrinkWrap: true,
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount:
                                                        armbandChildren.length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 4.0),
                                                    itemBuilder: (context,
                                                        armbandChildrenIndex) {
                                                      final armbandChildrenItem =
                                                          armbandChildren[
                                                              armbandChildrenIndex];
                                                      return wrapWithModel(
                                                        model: _model
                                                            .cHomeEntriesCardModels1
                                                            .getModel(
                                                          'ukHomeEntriesCard',
                                                          armbandChildrenIndex,
                                                        ),
                                                        updateCallback: () =>
                                                            safeSetState(() {}),
                                                        child:
                                                            CHomeEntriesCardWidget(
                                                          key: Key(
                                                            'Key17c_${'ukHomeEntriesCard'}',
                                                          ),
                                                          cpArmband:
                                                              valueOrDefault<
                                                                  int>(
                                                            armbandChildrenItem
                                                                .armband,
                                                            0,
                                                          ),
                                                          cpCallName:
                                                              valueOrDefault<
                                                                  String>(
                                                            armbandChildrenItem
                                                                .callName,
                                                            'CallName',
                                                          ),
                                                          cpBreed:
                                                              valueOrDefault<
                                                                  String>(
                                                            armbandChildrenItem
                                                                .breed,
                                                            'Breed',
                                                          ),
                                                          cpHandler:
                                                              valueOrDefault<
                                                                  String>(
                                                            armbandChildrenItem
                                                                .handler,
                                                            'Handler',
                                                          ),
                                                          cpIndex:
                                                              armbandChildrenIndex,
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                );
                                              },
                                            );
                                          } else if (_model
                                                  .choiceChipsSortValue ==
                                              'Name') {
                                            return Builder(
                                              builder: (context) {
                                                final callnameChildren =
                                                    queryHomeEntriesViewUniqueArmbandsRowList
                                                        .sortedList(
                                                            keyOf: (e) =>
                                                                e.callName!,
                                                            desc: false)
                                                        .toList();
                                                if (callnameChildren.isEmpty) {
                                                  return CEmptyListWidget();
                                                }

                                                return RefreshIndicator(
                                                  key: Key(
                                                      'RefreshIndicator_o7czoebs'),
                                                  onRefresh: () async {
                                                    safeSetState(() {
                                                      _model
                                                          .clearArmbandListCache();
                                                      _model.requestCompleted1 =
                                                          false;
                                                    });
                                                    await _model
                                                        .waitForRequestCompleted1();
                                                  },
                                                  child: ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 4.0),
                                                    primary: false,
                                                    shrinkWrap: true,
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount:
                                                        callnameChildren.length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 4.0),
                                                    itemBuilder: (context,
                                                        callnameChildrenIndex) {
                                                      final callnameChildrenItem =
                                                          callnameChildren[
                                                              callnameChildrenIndex];
                                                      return wrapWithModel(
                                                        model: _model
                                                            .cHomeEntriesCardModels2
                                                            .getModel(
                                                          'ukHomeEntriesCard',
                                                          callnameChildrenIndex,
                                                        ),
                                                        updateCallback: () =>
                                                            safeSetState(() {}),
                                                        child:
                                                            CHomeEntriesCardWidget(
                                                          key: Key(
                                                            'Keyx1i_${'ukHomeEntriesCard'}',
                                                          ),
                                                          cpArmband:
                                                              callnameChildrenItem
                                                                  .armband,
                                                          cpCallName:
                                                              callnameChildrenItem
                                                                  .callName,
                                                          cpBreed:
                                                              callnameChildrenItem
                                                                  .breed,
                                                          cpHandler:
                                                              callnameChildrenItem
                                                                  .handler,
                                                          cpIndex:
                                                              callnameChildrenIndex,
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                );
                                              },
                                            );
                                          } else if (_model
                                                  .choiceChipsSortValue ==
                                              'Handler') {
                                            return Builder(
                                              builder: (context) {
                                                final handlerChildren =
                                                    queryHomeEntriesViewUniqueArmbandsRowList
                                                        .sortedList(
                                                            keyOf: (e) =>
                                                                e.handler!,
                                                            desc: false)
                                                        .toList();
                                                if (handlerChildren.isEmpty) {
                                                  return CEmptyListWidget();
                                                }

                                                return RefreshIndicator(
                                                  key: Key(
                                                      'RefreshIndicator_rwbtymwc'),
                                                  onRefresh: () async {
                                                    safeSetState(() {
                                                      _model
                                                          .clearArmbandListCache();
                                                      _model.requestCompleted1 =
                                                          false;
                                                    });
                                                    await _model
                                                        .waitForRequestCompleted1();
                                                  },
                                                  child: ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 4.0),
                                                    primary: false,
                                                    shrinkWrap: true,
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount:
                                                        handlerChildren.length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 4.0),
                                                    itemBuilder: (context,
                                                        handlerChildrenIndex) {
                                                      final handlerChildrenItem =
                                                          handlerChildren[
                                                              handlerChildrenIndex];
                                                      return wrapWithModel(
                                                        model: _model
                                                            .cHomeEntriesCardModels3
                                                            .getModel(
                                                          'ukHomeEntriesCard',
                                                          handlerChildrenIndex,
                                                        ),
                                                        updateCallback: () =>
                                                            safeSetState(() {}),
                                                        child:
                                                            CHomeEntriesCardWidget(
                                                          key: Key(
                                                            'Key67v_${'ukHomeEntriesCard'}',
                                                          ),
                                                          cpArmband:
                                                              handlerChildrenItem
                                                                  .armband,
                                                          cpCallName:
                                                              handlerChildrenItem
                                                                  .callName,
                                                          cpBreed:
                                                              handlerChildrenItem
                                                                  .breed,
                                                          cpHandler:
                                                              handlerChildrenItem
                                                                  .handler,
                                                          cpIndex:
                                                              handlerChildrenIndex,
                                                        ),
                                                      );
                                                    },
                                                  ),
                                                );
                                              },
                                            );
                                          } else {
                                            return Builder(
                                              builder: (context) {
                                                final favoritesChildren =
                                                    queryHomeEntriesViewUniqueArmbandsRowList
                                                        .where((e) =>
                                                            FFAppState()
                                                                .asFavorite
                                                                .contains(
                                                                    e.armband))
                                                        .toList()
                                                        .sortedList(
                                                            keyOf: (e) =>
                                                                e.armband!,
                                                            desc: false)
                                                        .toList();
                                                if (favoritesChildren.isEmpty) {
                                                  return CEmptyFavoritesWidget();
                                                }

                                                return RefreshIndicator(
                                                  key: Key(
                                                      'RefreshIndicator_4eewku8m'),
                                                  onRefresh: () async {
                                                    safeSetState(() {
                                                      _model
                                                          .clearArmbandListCache();
                                                      _model.requestCompleted1 =
                                                          false;
                                                    });
                                                    await _model
                                                        .waitForRequestCompleted1();
                                                  },
                                                  child: ListView.separated(
                                                    padding:
                                                        EdgeInsets.symmetric(
                                                            vertical: 4.0),
                                                    primary: false,
                                                    shrinkWrap: true,
                                                    scrollDirection:
                                                        Axis.vertical,
                                                    itemCount: favoritesChildren
                                                        .length,
                                                    separatorBuilder: (_, __) =>
                                                        SizedBox(height: 4.0),
                                                    itemBuilder: (context,
                                                        favoritesChildrenIndex) {
                                                      final favoritesChildrenItem =
                                                          favoritesChildren[
                                                              favoritesChildrenIndex];
                                                      return wrapWithModel(
                                                        model: _model
                                                            .cHomeEntriesCardModels4
                                                            .getModel(
                                                          'ukHomeEntries',
                                                          favoritesChildrenIndex,
                                                        ),
                                                        updateCallback: () =>
                                                            safeSetState(() {}),
                                                        child:
                                                            CHomeEntriesCardWidget(
                                                          key: Key(
                                                            'Keyjch_${'ukHomeEntries'}',
                                                          ),
                                                          cpArmband:
                                                              favoritesChildrenItem
                                                                  .armband,
                                                          cpCallName:
                                                              favoritesChildrenItem
                                                                  .callName,
                                                          cpBreed:
                                                              favoritesChildrenItem
                                                                  .breed,
                                                          cpHandler:
                                                              favoritesChildrenItem
                                                                  .handler,
                                                          cpIndex:
                                                              favoritesChildrenIndex,
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
                                  ],
                                ),
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
              ),
              Align(
                alignment: AlignmentDirectional(0.0, 1.0),
                child: wrapWithModel(
                  model: _model.cNavigationBarModel,
                  updateCallback: () => safeSetState(() {}),
                  child: CNavigationBarWidget(
                    cpSelectedPageIndex: 1,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
