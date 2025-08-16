import '/backend/supabase/supabase.dart';
import '/components/c_navigation_bar/c_navigation_bar_widget.dart';
import '/components/c_time_expired_no_sound/c_time_expired_no_sound_widget.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_icon_button.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_timer.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/flutter_flow/instant_timer.dart';
import '/flutter_flow/custom_functions.dart' as functions;
import '/index.dart';
import 'package:stop_watch_timer/stop_watch_timer.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:just_audio/just_audio.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:provider/provider.dart';
import 'p_max_time_stop_watch_model.dart';
export 'p_max_time_stop_watch_model.dart';

class PMaxTimeStopWatchWidget extends StatefulWidget {
  const PMaxTimeStopWatchWidget({
    super.key,
    required this.ppEntryRow,
  });

  final ViewEntryClassJoinDistinctRow? ppEntryRow;

  static String routeName = 'p_MaxTimeStopWatch';
  static String routePath = '/MaxTimeStopWatch';

  @override
  State<PMaxTimeStopWatchWidget> createState() =>
      _PMaxTimeStopWatchWidgetState();
}

class _PMaxTimeStopWatchWidgetState extends State<PMaxTimeStopWatchWidget> {
  late PMaxTimeStopWatchModel _model;

  final scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => PMaxTimeStopWatchModel());

    // On page load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      FFAppState().asActivePage = 'p_MaxTimeStopWatch';
      safeSetState(() {});
      _model.psMaxTimeMS =
          functions.convertTextTimeToMS(widget.ppEntryRow!.timeLimit!);
      _model.psMaxTime = widget.ppEntryRow?.timeLimit;
      safeSetState(() {});
      _model.timerMaxTimeController.timer.setPresetTime(
        mSec: _model.psMaxTimeMS,
        add: false,
      );
      _model.timerMaxTimeController.onResetTimer();
    });

    _model.switchValue = true;
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
                color: Colors.white,
                size: 30.0,
              ),
              onPressed: () async {
                HapticFeedback.heavyImpact();
                FFAppState().asStopButtonShown = false;
                safeSetState(() {});
                _model.timerMaxTimeController.onStopTimer();

                context.pushNamed(
                  PEntryListAllWidget.routeName,
                  queryParameters: {
                    'ppArmband': serializeParam(
                      widget.ppEntryRow?.armband,
                      ParamType.int,
                    ),
                    'ppCallName': serializeParam(
                      widget.ppEntryRow?.callName,
                      ParamType.String,
                    ),
                    'ppBreed': serializeParam(
                      widget.ppEntryRow?.breed,
                      ParamType.String,
                    ),
                    'ppHandler': serializeParam(
                      widget.ppEntryRow?.handler,
                      ParamType.String,
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
              'Max Time Countdown Timer',
              style: FlutterFlowTheme.of(context).headlineMedium.override(
                    fontFamily:
                        FlutterFlowTheme.of(context).headlineMediumFamily,
                    color: Colors.white,
                    fontSize: 20.0,
                    letterSpacing: 0.0,
                    fontWeight: FontWeight.w500,
                    useGoogleFonts:
                        !FlutterFlowTheme.of(context).headlineMediumIsCustom,
                  ),
            ),
            actions: [],
            centerTitle: true,
            elevation: 2.0,
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
                        mainAxisSize: MainAxisSize.max,
                        crossAxisAlignment: CrossAxisAlignment.center,
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
                                        .primaryBorder,
                                    width: 2.0,
                                  ),
                                ),
                                child: Column(
                                  mainAxisSize: MainAxisSize.max,
                                  children: [
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 4.0, 4.0, 0.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.max,
                                        mainAxisAlignment:
                                            MainAxisAlignment.spaceBetween,
                                        children: [
                                          SelectionArea(
                                              child: Text(
                                            valueOrDefault<String>(
                                              widget.ppEntryRow?.trialDate,
                                              'Trial Date',
                                            ),
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  fontFamily:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumFamily,
                                                  letterSpacing: 0.0,
                                                  useGoogleFonts:
                                                      !FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumIsCustom,
                                                ),
                                          )),
                                        ],
                                      ),
                                    ),
                                    Padding(
                                      padding: EdgeInsetsDirectional.fromSTEB(
                                          4.0, 4.0, 4.0, 0.0),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.max,
                                        children: [
                                          Padding(
                                            padding:
                                                EdgeInsetsDirectional.fromSTEB(
                                                    0.0, 0.0, 4.0, 0.0),
                                            child: SelectionArea(
                                                child: Text(
                                              valueOrDefault<String>(
                                                widget.ppEntryRow?.trialNumber,
                                                'Trial Number',
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
                                          ),
                                          Text(
                                            '${widget.ppEntryRow?.element} ${widget.ppEntryRow?.level} ${widget.ppEntryRow?.section}',
                                            style: FlutterFlowTheme.of(context)
                                                .bodyMedium
                                                .override(
                                                  fontFamily:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumFamily,
                                                  letterSpacing: 0.0,
                                                  useGoogleFonts:
                                                      !FlutterFlowTheme.of(
                                                              context)
                                                          .bodyMediumIsCustom,
                                                ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    Column(
                                      mainAxisSize: MainAxisSize.max,
                                      children: [
                                        Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          children: [
                                            Padding(
                                              padding: EdgeInsets.all(8.0),
                                              child: Container(
                                                width: 60.0,
                                                height: 60.0,
                                                decoration: BoxDecoration(
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .secondary,
                                                  shape: BoxShape.circle,
                                                ),
                                                alignment: AlignmentDirectional(
                                                    0.0, 0.1),
                                                child: Text(
                                                  valueOrDefault<String>(
                                                    widget.ppEntryRow?.armband
                                                        ?.toString(),
                                                    'Armband',
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
                                                            !FlutterFlowTheme
                                                                    .of(context)
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
                                                    widget
                                                        .ppEntryRow?.callName,
                                                    'Call Name',
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
                                                                .primary,
                                                        letterSpacing: 0.0,
                                                        useGoogleFonts:
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                                ),
                                                Text(
                                                  valueOrDefault<String>(
                                                    widget.ppEntryRow?.breed,
                                                    'Breed',
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
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                                ),
                                                Text(
                                                  valueOrDefault<String>(
                                                    widget.ppEntryRow?.handler,
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
                                                            !FlutterFlowTheme
                                                                    .of(context)
                                                                .bodyMediumIsCustom,
                                                      ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ),
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
                                        .primaryBorder,
                                    width: 2.0,
                                  ),
                                ),
                                child: Padding(
                                  padding: EdgeInsets.all(10.0),
                                  child: Column(
                                    mainAxisSize: MainAxisSize.max,
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 0.0, 16.0),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.start,
                                          crossAxisAlignment:
                                              CrossAxisAlignment.center,
                                          children: [
                                            Expanded(
                                              child: Text(
                                                'Max Time: ${_model.psMaxTime}',
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
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(0.0, 0.0, 4.0, 0.0),
                                              child: Text(
                                                'Warning Sound',
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
                                            Switch.adaptive(
                                              value: _model.switchValue!,
                                              onChanged: (newValue) async {
                                                safeSetState(() => _model
                                                    .switchValue = newValue);
                                              },
                                              activeColor:
                                                  FlutterFlowTheme.of(context)
                                                      .primary,
                                              activeTrackColor:
                                                  FlutterFlowTheme.of(context)
                                                      .tertiary,
                                              inactiveTrackColor:
                                                  FlutterFlowTheme.of(context)
                                                      .alternate,
                                              inactiveThumbColor:
                                                  FlutterFlowTheme.of(context)
                                                      .primary,
                                            ),
                                          ],
                                        ),
                                      ),
                                      Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            0.0, 0.0, 0.0, 12.0),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: [
                                            Column(
                                              mainAxisSize: MainAxisSize.max,
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.center,
                                              children: [
                                                Builder(
                                                  builder: (context) =>
                                                      FlutterFlowTimer(
                                                    initialTime:
                                                        _model.psMaxTimeMS,
                                                    getDisplayTime: (value) =>
                                                        StopWatchTimer
                                                            .getDisplayTime(
                                                      value,
                                                      hours: false,
                                                      milliSecond: false,
                                                    ),
                                                    controller: _model
                                                        .timerMaxTimeController,
                                                    updateStateInterval:
                                                        Duration(
                                                            milliseconds: 1000),
                                                    onChanged: (value,
                                                        displayTime,
                                                        shouldUpdate) {
                                                      _model.timerMaxTimeMilliseconds =
                                                          value;
                                                      _model.timerMaxTimeValue =
                                                          displayTime;
                                                      if (shouldUpdate)
                                                        safeSetState(() {});
                                                    },
                                                    onEnded: () async {
                                                      HapticFeedback
                                                          .heavyImpact();
                                                      FFAppState()
                                                              .asStopButtonShown =
                                                          false;
                                                      safeSetState(() {});
                                                      _model
                                                          .timerMaxTimeController
                                                          .onStopTimer();
                                                      await showDialog(
                                                        context: context,
                                                        builder:
                                                            (dialogContext) {
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
                                                                  CTimeExpiredNoSoundWidget(),
                                                            ),
                                                          );
                                                        },
                                                      );
                                                    },
                                                    textAlign: TextAlign.start,
                                                    style: FlutterFlowTheme.of(
                                                            context)
                                                        .bodyMedium
                                                        .override(
                                                          font: GoogleFonts
                                                              .openSans(
                                                            fontWeight:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontWeight,
                                                            fontStyle:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMedium
                                                                    .fontStyle,
                                                          ),
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .tertiary,
                                                          fontSize: 0.0,
                                                          letterSpacing: 0.0,
                                                          fontWeight:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontWeight,
                                                          fontStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .bodyMedium
                                                                  .fontStyle,
                                                        ),
                                                  ),
                                                ),
                                                if ((widget.ppEntryRow
                                                            ?.element ==
                                                        'Interior') &&
                                                    (widget.ppEntryRow
                                                            ?.level ==
                                                        'Excellent'))
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 0.0,
                                                                0.0, 16.0),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .center,
                                                      children: [
                                                        Padding(
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      0.0,
                                                                      16.0),
                                                          child:
                                                              FlutterFlowChoiceChips(
                                                            options: [
                                                              ChipData(
                                                                  'Area 1'),
                                                              ChipData('Area 2')
                                                            ],
                                                            onChanged:
                                                                (val) async {
                                                              safeSetState(() =>
                                                                  _model.ccTwoAreasValue =
                                                                      val?.firstOrNull);
                                                              if (_model
                                                                      .ccTwoAreasValue ==
                                                                  'Area 2') {
                                                                _model.psMaxTime =
                                                                    widget
                                                                        .ppEntryRow
                                                                        ?.timeLimit2;
                                                                _model.psMaxTimeMS =
                                                                    functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!);
                                                                safeSetState(
                                                                    () {});
                                                              } else {
                                                                _model.psMaxTime =
                                                                    widget
                                                                        .ppEntryRow
                                                                        ?.timeLimit;
                                                                _model.psMaxTimeMS =
                                                                    functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit!);
                                                                safeSetState(
                                                                    () {});
                                                              }

                                                              _model
                                                                  .timerMaxTimeController
                                                                  .timer
                                                                  .setPresetTime(
                                                                mSec: _model
                                                                    .psMaxTimeMS,
                                                                add: false,
                                                              );
                                                              _model
                                                                  .timerMaxTimeController
                                                                  .onResetTimer();
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
                                                                        fontFamily:
                                                                            FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .colorWhite,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        useGoogleFonts:
                                                                            !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                      ),
                                                              iconColor: Color(
                                                                  0x00000000),
                                                              iconSize: 16.0,
                                                              elevation: 0.0,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                            ),
                                                            unselectedChipStyle:
                                                                ChipStyle(
                                                              backgroundColor:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .accent3,
                                                              textStyle:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .secondaryText,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        useGoogleFonts:
                                                                            !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                      ),
                                                              iconColor: Color(
                                                                  0x00000000),
                                                              iconSize: 16.0,
                                                              elevation: 0.0,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                            ),
                                                            chipSpacing: 24.0,
                                                            rowSpacing: 8.0,
                                                            multiselect: false,
                                                            initialized: _model
                                                                    .ccTwoAreasValue !=
                                                                null,
                                                            alignment:
                                                                WrapAlignment
                                                                    .start,
                                                            controller: _model
                                                                    .ccTwoAreasValueController ??=
                                                                FormFieldController<
                                                                    List<
                                                                        String>>(
                                                              ['Area 1'],
                                                            ),
                                                            wrapped: true,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                if ((widget.ppEntryRow
                                                            ?.element ==
                                                        'Interior') &&
                                                    (widget.ppEntryRow
                                                            ?.level ==
                                                        'Master'))
                                                  Padding(
                                                    padding:
                                                        EdgeInsetsDirectional
                                                            .fromSTEB(0.0, 0.0,
                                                                0.0, 16.0),
                                                    child: Row(
                                                      mainAxisSize:
                                                          MainAxisSize.max,
                                                      mainAxisAlignment:
                                                          MainAxisAlignment
                                                              .center,
                                                      children: [
                                                        Padding(
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      0.0,
                                                                      16.0),
                                                          child:
                                                              FlutterFlowChoiceChips(
                                                            options: [
                                                              ChipData(
                                                                  'Area 1'),
                                                              ChipData(
                                                                  'Area 2'),
                                                              ChipData('Area 3')
                                                            ],
                                                            onChanged:
                                                                (val) async {
                                                              safeSetState(() =>
                                                                  _model.ccThreeAreasValue =
                                                                      val?.firstOrNull);
                                                              if (_model
                                                                      .ccThreeAreasValue ==
                                                                  'Area 2') {
                                                                _model.psMaxTime =
                                                                    widget
                                                                        .ppEntryRow
                                                                        ?.timeLimit2;
                                                                _model.psMaxTimeMS =
                                                                    functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit2!);
                                                                safeSetState(
                                                                    () {});
                                                              } else if (_model
                                                                      .ccThreeAreasValue ==
                                                                  'Area 3') {
                                                                _model.psMaxTime =
                                                                    widget
                                                                        .ppEntryRow
                                                                        ?.timeLimit3;
                                                                _model.psMaxTimeMS =
                                                                    functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit3!);
                                                                safeSetState(
                                                                    () {});
                                                              } else {
                                                                _model.psMaxTime =
                                                                    widget
                                                                        .ppEntryRow
                                                                        ?.timeLimit;
                                                                _model.psMaxTimeMS =
                                                                    functions.convertTextTimeToMS(widget
                                                                        .ppEntryRow!
                                                                        .timeLimit!);
                                                                safeSetState(
                                                                    () {});
                                                              }

                                                              _model
                                                                  .timerMaxTimeController
                                                                  .timer
                                                                  .setPresetTime(
                                                                mSec: _model
                                                                    .psMaxTimeMS,
                                                                add: false,
                                                              );
                                                              _model
                                                                  .timerMaxTimeController
                                                                  .onResetTimer();
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
                                                                        fontFamily:
                                                                            FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .colorWhite,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        useGoogleFonts:
                                                                            !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                      ),
                                                              iconColor: Color(
                                                                  0x00000000),
                                                              iconSize: 16.0,
                                                              elevation: 0.0,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                            ),
                                                            unselectedChipStyle:
                                                                ChipStyle(
                                                              backgroundColor:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .accent3,
                                                              textStyle:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .bodyMedium
                                                                      .override(
                                                                        fontFamily:
                                                                            FlutterFlowTheme.of(context).bodyMediumFamily,
                                                                        color: FlutterFlowTheme.of(context)
                                                                            .secondaryText,
                                                                        letterSpacing:
                                                                            0.0,
                                                                        useGoogleFonts:
                                                                            !FlutterFlowTheme.of(context).bodyMediumIsCustom,
                                                                      ),
                                                              iconColor: Color(
                                                                  0x00000000),
                                                              iconSize: 16.0,
                                                              elevation: 0.0,
                                                              borderRadius:
                                                                  BorderRadius
                                                                      .circular(
                                                                          8.0),
                                                            ),
                                                            chipSpacing: 24.0,
                                                            rowSpacing: 8.0,
                                                            multiselect: false,
                                                            initialized: _model
                                                                    .ccThreeAreasValue !=
                                                                null,
                                                            alignment:
                                                                WrapAlignment
                                                                    .start,
                                                            controller: _model
                                                                    .ccThreeAreasValueController ??=
                                                                FormFieldController<
                                                                    List<
                                                                        String>>(
                                                              ['Area 1'],
                                                            ),
                                                            wrapped: true,
                                                          ),
                                                        ),
                                                      ],
                                                    ),
                                                  ),
                                                CircularPercentIndicator(
                                                  percent: functions
                                                      .maxTimeProgressBar(
                                                          _model.psMaxTimeMS,
                                                          _model
                                                              .timerMaxTimeMilliseconds),
                                                  radius: 100.0,
                                                  lineWidth: 16.0,
                                                  animation: true,
                                                  animateFromLastPercent: true,
                                                  progressColor: _model
                                                              .timerMaxTimeMilliseconds <=
                                                          31000
                                                      ? FlutterFlowTheme.of(
                                                              context)
                                                          .error
                                                      : FlutterFlowTheme.of(
                                                              context)
                                                          .tertiary,
                                                  backgroundColor:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .accent4,
                                                  center: Text(
                                                    _model.timerMaxTimeValue,
                                                    style:
                                                        FlutterFlowTheme.of(
                                                                context)
                                                            .headlineSmall
                                                            .override(
                                                              fontFamily:
                                                                  FlutterFlowTheme.of(
                                                                          context)
                                                                      .headlineSmallFamily,
                                                              color: _model
                                                                          .timerMaxTimeMilliseconds <=
                                                                      31000
                                                                  ? FlutterFlowTheme.of(
                                                                          context)
                                                                      .error
                                                                  : FlutterFlowTheme.of(
                                                                          context)
                                                                      .tertiary,
                                                              fontSize: 40.0,
                                                              letterSpacing:
                                                                  0.0,
                                                              fontWeight:
                                                                  FontWeight
                                                                      .normal,
                                                              useGoogleFonts:
                                                                  !FlutterFlowTheme.of(
                                                                          context)
                                                                      .headlineSmallIsCustom,
                                                            ),
                                                  ),
                                                ),
                                                if ((_model.timerMaxTimeMilliseconds <=
                                                        31000) &&
                                                    (_model.timerMaxTimeMilliseconds !=
                                                        00000))
                                                  Padding(
                                                    padding:
                                                        EdgeInsets.all(12.0),
                                                    child: Text(
                                                      '30 Second Warning',
                                                      style:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .bodyMedium
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .bodyMediumFamily,
                                                                color: FlutterFlowTheme.of(
                                                                        context)
                                                                    .error,
                                                                fontSize: 32.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .bodyMediumIsCustom,
                                                              ),
                                                    ),
                                                  ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      Padding(
                                        padding: EdgeInsetsDirectional.fromSTEB(
                                            0.0, 12.0, 0.0, 12.0),
                                        child: Row(
                                          mainAxisSize: MainAxisSize.max,
                                          mainAxisAlignment:
                                              MainAxisAlignment.spaceEvenly,
                                          children: [
                                            Builder(
                                              builder: (context) {
                                                if (FFAppState()
                                                    .asStopButtonShown) {
                                                  return Stack(
                                                    children: [
                                                      FFButtonWidget(
                                                        onPressed: () async {
                                                          HapticFeedback
                                                              .heavyImpact();
                                                          _model
                                                              .timerMaxTimeController
                                                              .onStopTimer();
                                                          _model.soundPlayer1
                                                              ?.stop();
                                                          _model.soundPlayer2
                                                              ?.stop();
                                                          FFAppState()
                                                                  .asStopButtonShown =
                                                              false;
                                                          safeSetState(() {});
                                                        },
                                                        text: 'Stop',
                                                        icon: Icon(
                                                          Icons
                                                              .stop_circle_rounded,
                                                          size: 28.0,
                                                        ),
                                                        options:
                                                            FFButtonOptions(
                                                          width: 120.0,
                                                          height: 72.0,
                                                          padding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      0.0,
                                                                      0.0),
                                                          iconPadding:
                                                              EdgeInsetsDirectional
                                                                  .fromSTEB(
                                                                      0.0,
                                                                      0.0,
                                                                      0.0,
                                                                      0.0),
                                                          color: FlutterFlowTheme
                                                                  .of(context)
                                                              .alternate,
                                                          textStyle:
                                                              FlutterFlowTheme.of(
                                                                      context)
                                                                  .titleSmall
                                                                  .override(
                                                                    fontFamily:
                                                                        FlutterFlowTheme.of(context)
                                                                            .titleSmallFamily,
                                                                    color: Colors
                                                                        .white,
                                                                    fontSize:
                                                                        20.0,
                                                                    letterSpacing:
                                                                        0.0,
                                                                    useGoogleFonts:
                                                                        !FlutterFlowTheme.of(context)
                                                                            .titleSmallIsCustom,
                                                                  ),
                                                          elevation: 2.0,
                                                          borderRadius:
                                                              BorderRadius
                                                                  .circular(
                                                                      30.0),
                                                        ),
                                                        showLoadingIndicator:
                                                            false,
                                                      ),
                                                    ],
                                                  );
                                                } else {
                                                  return FFButtonWidget(
                                                    onPressed: () async {
                                                      _model
                                                          .timerMaxTimeController
                                                          .onStartTimer();
                                                      FFAppState()
                                                              .asStopButtonShown =
                                                          true;
                                                      safeSetState(() {});
                                                      _model.Timer30 =
                                                          InstantTimer.periodic(
                                                        duration: Duration(
                                                            milliseconds: 1000),
                                                        callback:
                                                            (timer) async {
                                                          if (_model
                                                                  .timerMaxTimeMilliseconds <
                                                              31000) {
                                                            _model.Timer30
                                                                ?.cancel();
                                                            HapticFeedback
                                                                .heavyImpact();
                                                            if (_model
                                                                    .switchValue !=
                                                                true) {
                                                              return;
                                                            }
                                                            _model.soundPlayer1 ??=
                                                                AudioPlayer();
                                                            if (_model
                                                                .soundPlayer1!
                                                                .playing) {
                                                              await _model
                                                                  .soundPlayer1!
                                                                  .stop();
                                                            }
                                                            _model.soundPlayer1!
                                                                .setVolume(1.0);
                                                            _model.soundPlayer1!
                                                                .setAsset(
                                                                    'assets/audios/warning.mp3')
                                                                .then((_) => _model
                                                                    .soundPlayer1!
                                                                    .play());

                                                            _model.soundPlayer1
                                                                ?.stop();
                                                            _model.Timer30
                                                                ?.cancel();
                                                            _model.Timer10 =
                                                                InstantTimer
                                                                    .periodic(
                                                              duration: Duration(
                                                                  milliseconds:
                                                                      1000),
                                                              callback:
                                                                  (timer) async {
                                                                if (_model
                                                                        .timerMaxTimeMilliseconds <
                                                                    11000) {
                                                                  _model.Timer10
                                                                      ?.cancel();
                                                                  HapticFeedback
                                                                      .heavyImpact();
                                                                  if (_model
                                                                          .switchValue !=
                                                                      true) {
                                                                    return;
                                                                  }
                                                                  _model.soundPlayer2 ??=
                                                                      AudioPlayer();
                                                                  if (_model
                                                                      .soundPlayer2!
                                                                      .playing) {
                                                                    await _model
                                                                        .soundPlayer2!
                                                                        .stop();
                                                                  }
                                                                  _model
                                                                      .soundPlayer2!
                                                                      .setVolume(
                                                                          1.0);
                                                                  _model
                                                                      .soundPlayer2!
                                                                      .setAsset(
                                                                          'assets/audios/warning.mp3')
                                                                      .then((_) => _model
                                                                          .soundPlayer2!
                                                                          .play());

                                                                  _model
                                                                      .soundPlayer2
                                                                      ?.stop();
                                                                  _model.Timer10
                                                                      ?.cancel();
                                                                  return;
                                                                } else {
                                                                  return;
                                                                }
                                                              },
                                                              startImmediately:
                                                                  false,
                                                            );
                                                          } else {
                                                            return;
                                                          }
                                                        },
                                                        startImmediately: false,
                                                      );
                                                    },
                                                    text: 'Start',
                                                    icon: Icon(
                                                      Icons.play_circle_rounded,
                                                      size: 28.0,
                                                    ),
                                                    options: FFButtonOptions(
                                                      width: 120.0,
                                                      height: 72.0,
                                                      padding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  0.0,
                                                                  0.0,
                                                                  0.0),
                                                      iconPadding:
                                                          EdgeInsetsDirectional
                                                              .fromSTEB(
                                                                  0.0,
                                                                  0.0,
                                                                  0.0,
                                                                  0.0),
                                                      color:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .tertiary,
                                                      textStyle:
                                                          FlutterFlowTheme.of(
                                                                  context)
                                                              .titleSmall
                                                              .override(
                                                                fontFamily: FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallFamily,
                                                                color: Colors
                                                                    .white,
                                                                fontSize: 20.0,
                                                                letterSpacing:
                                                                    0.0,
                                                                useGoogleFonts:
                                                                    !FlutterFlowTheme.of(
                                                                            context)
                                                                        .titleSmallIsCustom,
                                                              ),
                                                      elevation: 2.0,
                                                      borderSide: BorderSide(
                                                        color:
                                                            Colors.transparent,
                                                      ),
                                                      borderRadius:
                                                          BorderRadius.circular(
                                                              30.0),
                                                    ),
                                                  );
                                                }
                                              },
                                            ),
                                            Padding(
                                              padding: EdgeInsetsDirectional
                                                  .fromSTEB(
                                                      0.0, 24.0, 0.0, 0.0),
                                              child: FFButtonWidget(
                                                onPressed: FFAppState()
                                                        .asStopButtonShown
                                                    ? null
                                                    : () async {
                                                        HapticFeedback
                                                            .heavyImpact();
                                                        _model
                                                            .timerMaxTimeController
                                                            .onResetTimer();

                                                        FFAppState()
                                                                .asStopButtonShown =
                                                            false;
                                                        safeSetState(() {});
                                                      },
                                                text: '',
                                                icon: Icon(
                                                  Icons.restore,
                                                  size: 28.0,
                                                ),
                                                options: FFButtonOptions(
                                                  width: 50.0,
                                                  height: 50.0,
                                                  padding: EdgeInsetsDirectional
                                                      .fromSTEB(
                                                          0.0, 0.0, 0.0, 0.0),
                                                  iconPadding:
                                                      EdgeInsetsDirectional
                                                          .fromSTEB(6.0, 2.0,
                                                              0.0, 0.0),
                                                  color: FlutterFlowTheme.of(
                                                          context)
                                                      .backgroundComponents,
                                                  textStyle:
                                                      FlutterFlowTheme.of(
                                                              context)
                                                          .titleSmall
                                                          .override(
                                                            fontFamily:
                                                                FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallFamily,
                                                            color: Colors.white,
                                                            fontSize: 20.0,
                                                            letterSpacing: 0.0,
                                                            useGoogleFonts:
                                                                !FlutterFlowTheme.of(
                                                                        context)
                                                                    .titleSmallIsCustom,
                                                          ),
                                                  elevation: 2.0,
                                                  borderRadius:
                                                      BorderRadius.circular(
                                                          100.0),
                                                ),
                                                showLoadingIndicator: false,
                                              ),
                                            ),
                                          ],
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
                ),
                Align(
                  alignment: AlignmentDirectional(0.0, 1.01),
                  child: wrapWithModel(
                    model: _model.cNavigationBarModel,
                    updateCallback: () => safeSetState(() {}),
                    child: CNavigationBarWidget(),
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
