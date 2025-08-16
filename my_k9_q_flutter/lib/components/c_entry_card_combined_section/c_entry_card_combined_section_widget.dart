import '/backend/api_requests/api_calls.dart';
import '/backend/supabase/supabase.dart';
import '/components/c_check_in_combined_section/c_check_in_combined_section_widget.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'package:badges/badges.dart' as badges;
import 'package:aligned_dialog/aligned_dialog.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'c_entry_card_combined_section_model.dart';
export 'c_entry_card_combined_section_model.dart';

class CEntryCardCombinedSectionWidget extends StatefulWidget {
  const CEntryCardCombinedSectionWidget({
    super.key,
    this.cpEntryRow,
    this.cpClassRow,
    this.cpTrialRow,
  });

  final ViewEntryClassJoinDistinctRow? cpEntryRow;
  final TblClassQueueRow? cpClassRow;
  final TblTrialQueueRow? cpTrialRow;

  @override
  State<CEntryCardCombinedSectionWidget> createState() =>
      _CEntryCardCombinedSectionWidgetState();
}

class _CEntryCardCombinedSectionWidgetState
    extends State<CEntryCardCombinedSectionWidget>
    with TickerProviderStateMixin {
  late CEntryCardCombinedSectionModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CEntryCardCombinedSectionModel());

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
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 300.0.ms,
            duration: 600.0.ms,
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
    _model.maybeDispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    context.watch<FFAppState>();

    return Padding(
      padding: EdgeInsetsDirectional.fromSTEB(8.0, 2.0, 8.0, 2.0),
      child: InkWell(
        splashColor: Colors.transparent,
        focusColor: Colors.transparent,
        hoverColor: Colors.transparent,
        highlightColor: Colors.transparent,
        onTap: () async {
          var _shouldSetState = false;
          HapticFeedback.heavyImpact();
          if ((FFAppState().asRole == 'Secretary') ||
              (FFAppState().asRole == 'Judge')) {
            await TblEntryQueueTable().update(
              data: {
                'in_ring': true,
              },
              matchingRows: (rows) => rows.eqOrNull(
                'id',
                widget.cpEntryRow?.id,
              ),
            );
            _shouldSetState = true;
            if (FFAppState().asOrg == 'AKC Scent Work') {
              if (FFAppState().asShowType == 'National') {
                if (widget.cpClassRow?.element != 'Handler Discrimination') {
                  context.pushNamed(
                    PScoresheetAKCScentNationalWidget.routeName,
                    queryParameters: {
                      'ppEntryRow': serializeParam(
                        widget.cpEntryRow,
                        ParamType.SupabaseRow,
                      ),
                      'ppClassRow': serializeParam(
                        widget.cpClassRow,
                        ParamType.SupabaseRow,
                      ),
                      'ppTrialRow': serializeParam(
                        widget.cpTrialRow,
                        ParamType.SupabaseRow,
                      ),
                    }.withoutNulls,
                  );

                  if (_shouldSetState) safeSetState(() {});
                  return;
                } else {
                  context.pushNamed(
                    PScoresheetAKCScentWorkWidget.routeName,
                    queryParameters: {
                      'ppEntryRow': serializeParam(
                        widget.cpEntryRow,
                        ParamType.SupabaseRow,
                      ),
                      'ppClassRow': serializeParam(
                        widget.cpClassRow,
                        ParamType.SupabaseRow,
                      ),
                      'ppTrialRow': serializeParam(
                        widget.cpTrialRow,
                        ParamType.SupabaseRow,
                      ),
                    }.withoutNulls,
                  );

                  if (_shouldSetState) safeSetState(() {});
                  return;
                }
              } else {
                context.pushNamed(
                  PScoresheetAKCScentWorkWidget.routeName,
                  queryParameters: {
                    'ppEntryRow': serializeParam(
                      widget.cpEntryRow,
                      ParamType.SupabaseRow,
                    ),
                    'ppClassRow': serializeParam(
                      widget.cpClassRow,
                      ParamType.SupabaseRow,
                    ),
                    'ppTrialRow': serializeParam(
                      widget.cpTrialRow,
                      ParamType.SupabaseRow,
                    ),
                  }.withoutNulls,
                );
              }

              if (_shouldSetState) safeSetState(() {});
              return;
            } else if (FFAppState().asOrg == 'UKC Nosework') {
              context.pushNamed(
                PScoresheetUKCNoseworkWidget.routeName,
                queryParameters: {
                  'ppEntryRow': serializeParam(
                    widget.cpEntryRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppClassRow': serializeParam(
                    widget.cpClassRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppTrialRow': serializeParam(
                    widget.cpTrialRow,
                    ParamType.SupabaseRow,
                  ),
                }.withoutNulls,
              );

              if (_shouldSetState) safeSetState(() {});
              return;
            } else if (FFAppState().asOrg == 'ASCA Scent Detection') {
              context.pushNamed(
                PScoresheetASCAScentWidget.routeName,
                queryParameters: {
                  'ppEntryRow': serializeParam(
                    widget.cpEntryRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppClassRow': serializeParam(
                    widget.cpClassRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppTrialRow': serializeParam(
                    widget.cpTrialRow,
                    ParamType.SupabaseRow,
                  ),
                }.withoutNulls,
              );

              if (_shouldSetState) safeSetState(() {});
              return;
            } else if (FFAppState().asOrg == 'AKC FastCat') {
              context.pushNamed(
                PScoresheetAKCFastCatWidget.routeName,
                queryParameters: {
                  'ppEntryRow': serializeParam(
                    widget.cpEntryRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppClassRow': serializeParam(
                    widget.cpClassRow,
                    ParamType.SupabaseRow,
                  ),
                  'ppTrialRow': serializeParam(
                    widget.cpTrialRow,
                    ParamType.SupabaseRow,
                  ),
                }.withoutNulls,
              );
            } else {
              if (_shouldSetState) safeSetState(() {});
              return;
            }
          } else {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  'You must be logged in as a Judge or Secretary',
                  style: FlutterFlowTheme.of(context).titleMedium.override(
                        fontFamily:
                            FlutterFlowTheme.of(context).titleMediumFamily,
                        color: FlutterFlowTheme.of(context).warning,
                        fontSize: 14.0,
                        letterSpacing: 0.0,
                        fontWeight: FontWeight.w500,
                        useGoogleFonts:
                            !FlutterFlowTheme.of(context).titleMediumIsCustom,
                      ),
                  textAlign: TextAlign.center,
                ),
                duration: Duration(milliseconds: 4000),
                backgroundColor: FlutterFlowTheme.of(context).secondary,
              ),
            );
            if (_shouldSetState) safeSetState(() {});
            return;
          }

          if (_shouldSetState) safeSetState(() {});
        },
        child: Container(
          width: double.infinity,
          height: 76.0,
          decoration: BoxDecoration(
            color: FlutterFlowTheme.of(context).secondaryBackground,
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
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.start,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
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
                        widget.cpEntryRow?.armband?.toString(),
                        '-',
                      ),
                      textAlign: TextAlign.center,
                      style: FlutterFlowTheme.of(context).bodyMedium.override(
                            fontFamily:
                                FlutterFlowTheme.of(context).bodyMediumFamily,
                            color: FlutterFlowTheme.of(context).colorWhite,
                            fontSize: 20.0,
                            letterSpacing: 0.0,
                            useGoogleFonts: !FlutterFlowTheme.of(context)
                                .bodyMediumIsCustom,
                          ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(0.0, 4.0, 0.0, 4.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        mainAxisAlignment: MainAxisAlignment.start,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          Flexible(
                            child: Padding(
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 8.0, 0.0),
                              child: Text(
                                valueOrDefault<String>(
                                  widget.cpEntryRow?.callName,
                                  '-',
                                ),
                                textAlign: TextAlign.start,
                                style: FlutterFlowTheme.of(context)
                                    .displaySmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .displaySmallFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .primaryText,
                                      fontSize: 14.0,
                                      letterSpacing: 0.0,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .displaySmallIsCustom,
                                    ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Expanded(
                          child: Text(
                            valueOrDefault<String>(
                              widget.cpEntryRow?.breed,
                              '-',
                            ).maybeHandleOverflow(
                              maxChars: 35,
                              replacement: '…',
                            ),
                            textAlign: TextAlign.start,
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryText,
                                  fontSize: 12.0,
                                  letterSpacing: 0.0,
                                  fontWeight: FontWeight.w500,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                        ),
                      ],
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        if (widget.cpEntryRow?.section != '-')
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                0.0, 0.0, 8.0, 0.0),
                            child: badges.Badge(
                              badgeContent: Text(
                                widget.cpEntryRow!.section!,
                                textAlign: TextAlign.start,
                                style: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodyMediumFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      fontSize: 10.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.normal,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
                                    ),
                              ),
                              showBadge: true,
                              shape: badges.BadgeShape.circle,
                              badgeColor:
                                  FlutterFlowTheme.of(context).secondary,
                              elevation: 1.0,
                              padding: EdgeInsets.all(4.0),
                              position: badges.BadgePosition.topStart(),
                              animationType: badges.BadgeAnimationType.scale,
                              toAnimate: true,
                            ),
                          ),
                        Text(
                          valueOrDefault<String>(
                            widget.cpEntryRow?.handler,
                            '-',
                          ).maybeHandleOverflow(
                            maxChars: 30,
                            replacement: '…',
                          ),
                          textAlign: TextAlign.start,
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodyMediumFamily,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
                                fontSize: 12.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w500,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodyMediumIsCustom,
                              ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.max,
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (FFAppState().asOrg == 'AKC FastCat')
                    Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 8.0, 0.0),
                      child: Text(
                        'Block: ${widget.cpEntryRow?.fastcatBlock}',
                        style: FlutterFlowTheme.of(context).labelLarge.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).labelLargeFamily,
                              color: FlutterFlowTheme.of(context).secondaryText,
                              fontSize: 12.0,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .labelLargeIsCustom,
                            ),
                      ),
                    ),
                  Row(
                    mainAxisSize: MainAxisSize.max,
                    children: [
                      if ((FFAppState().asOrg == 'AKC FastCat') &&
                          (widget.cpEntryRow?.fastcatHealthStatus == true))
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 4.0, 0.0),
                          child: Icon(
                            Icons.thumb_up_outlined,
                            color: FlutterFlowTheme.of(context).tertiary,
                            size: 18.0,
                          ),
                        ),
                      if ((FFAppState().asOrg == 'AKC FastCat') &&
                          (widget.cpEntryRow?.fastcatHealthStatus == false))
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 4.0, 0.0),
                          child: Icon(
                            Icons.thumb_down_off_alt_outlined,
                            color: FlutterFlowTheme.of(context).alternate,
                            size: 18.0,
                          ),
                        ),
                      if ((FFAppState().asOrg == 'AKC FastCat') &&
                          (widget.cpEntryRow?.fastcatHealthStatus != null))
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 8.0, 0.0),
                          child: Text(
                            'Health',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  color: FlutterFlowTheme.of(context)
                                      .secondaryText,
                                  fontSize: 12.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                        ),
                    ],
                  ),
                  if ((FFAppState().asOrg == 'AKC FastCat') &&
                      (widget.cpEntryRow?.fastcatHealthStatus != null))
                    Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 8.0, 0.0),
                      child: Text(
                        valueOrDefault<String>(
                          widget.cpEntryRow?.fastcatHealthTimestamp?.time
                              ?.toString(),
                          '-',
                        ),
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyMediumFamily,
                              color: FlutterFlowTheme.of(context).secondaryText,
                              fontSize: 12.0,
                              letterSpacing: 0.0,
                              fontWeight: FontWeight.w500,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyMediumIsCustom,
                            ),
                      ),
                    ),
                ],
              ),
              Builder(
                builder: (context) => InkWell(
                  splashColor: Colors.transparent,
                  focusColor: Colors.transparent,
                  hoverColor: Colors.transparent,
                  highlightColor: Colors.transparent,
                  onTap: () async {
                    var _shouldSetState = false;
                    HapticFeedback.heavyImpact();
                    if (FFAppState().asRole == 'Exhibitor') {
                      _model.aoApiResultSelfCheckinRealtimeResult =
                          await GetSelfCheckinRealtimeResultsCall.call(
                        mobileAppLicKey: 'eq.${FFAppState().asMobileAppLicKey}',
                        trialDate: 'eq.${widget.cpEntryRow?.trialDate}',
                        trialNumber: 'eq.${widget.cpEntryRow?.trialNumber}',
                        element: 'eq.${widget.cpEntryRow?.element}',
                        level: 'eq.${widget.cpEntryRow?.level}',
                      );

                      _shouldSetState = true;
                      if (widget.cpEntryRow!.selfCheckin!) {
                        await showAlignedDialog(
                          context: context,
                          isGlobal: false,
                          avoidOverflow: true,
                          targetAnchor: AlignmentDirectional(1.0, 0.0)
                              .resolve(Directionality.of(context)),
                          followerAnchor: AlignmentDirectional(1.0, 0.0)
                              .resolve(Directionality.of(context)),
                          builder: (dialogContext) {
                            return Material(
                              color: Colors.transparent,
                              child: CCheckInCombinedSectionWidget(
                                cpEntryRow: widget.cpEntryRow!,
                                cpClassRow: widget.cpClassRow,
                                cpTrialRow: widget.cpTrialRow,
                              ),
                            );
                          },
                        );

                        if (_shouldSetState) safeSetState(() {});
                        return;
                      } else {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(
                              'Exhibitor Self Check-in Disabled by Secretary',
                              style: TextStyle(
                                color: FlutterFlowTheme.of(context).warning,
                                fontWeight: FontWeight.w500,
                                fontSize: 14.0,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            duration: Duration(milliseconds: 4000),
                            backgroundColor:
                                FlutterFlowTheme.of(context).secondary,
                          ),
                        );
                        if (_shouldSetState) safeSetState(() {});
                        return;
                      }
                    } else {
                      await showAlignedDialog(
                        context: context,
                        isGlobal: false,
                        avoidOverflow: true,
                        targetAnchor: AlignmentDirectional(1.0, 0.0)
                            .resolve(Directionality.of(context)),
                        followerAnchor: AlignmentDirectional(1.0, 0.0)
                            .resolve(Directionality.of(context)),
                        builder: (dialogContext) {
                          return Material(
                            color: Colors.transparent,
                            child: CCheckInCombinedSectionWidget(
                              cpEntryRow: widget.cpEntryRow!,
                              cpClassRow: widget.cpClassRow,
                              cpTrialRow: widget.cpTrialRow,
                            ),
                          );
                        },
                      );

                      if (_shouldSetState) safeSetState(() {});
                      return;
                    }

                    if (_shouldSetState) safeSetState(() {});
                  },
                  child: Builder(
                    builder: (context) {
                      if (widget.cpEntryRow?.inRing ?? false) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context)
                                  .backgroundComponents,
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  FFIcons.krunningdog,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 32.0,
                                ),
                                Text(
                                  'In ring',
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        fontSize: 10.0,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if ((widget.cpEntryRow?.inRing == false) &&
                          (widget.cpEntryRow?.checkinStatus == 1)) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: Color(0xFF047B6A),
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.check_circle_rounded,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 20.0,
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 2.0, 0.0, 0.0),
                                  child: Text(
                                    'Checked-in',
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodyMediumFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .colorWhite,
                                          fontSize: 10.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w300,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodyMediumIsCustom,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if ((widget.cpEntryRow?.inRing == false) &&
                          (widget.cpEntryRow?.checkinStatus == 2)) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: Color(0xFFFFAB40),
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.compare_arrows_rounded,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 28.0,
                                ),
                                Text(
                                  'Conflict',
                                  textAlign: TextAlign.center,
                                  style: FlutterFlowTheme.of(context)
                                      .bodyMedium
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .bodyMediumFamily,
                                        color: FlutterFlowTheme.of(context)
                                            .colorWhite,
                                        fontSize: 10.0,
                                        letterSpacing: 0.0,
                                        fontWeight: FontWeight.w300,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .bodyMediumIsCustom,
                                      ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if ((widget.cpEntryRow?.inRing == false) &&
                          (widget.cpEntryRow?.checkinStatus == 3)) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context).alternate,
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.remove_done,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 20.0,
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 2.0, 0.0, 0.0),
                                  child: Text(
                                    'Pulled',
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodyMediumFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .colorWhite,
                                          fontSize: 10.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w300,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodyMediumIsCustom,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if ((widget.cpEntryRow?.inRing == false) &&
                          (widget.cpEntryRow?.checkinStatus == 4)) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: FlutterFlowTheme.of(context).tertiary,
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.fence,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 20.0,
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 2.0, 0.0, 0.0),
                                  child: Text(
                                    'At Gate',
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodyMediumFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .colorWhite,
                                          fontSize: 10.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w300,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodyMediumIsCustom,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else if ((widget.cpEntryRow?.inRing == false) &&
                          (widget.cpEntryRow?.checkinStatus == 5)) {
                        return Material(
                          color: Colors.transparent,
                          elevation: 1.0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Container(
                            width: 60.0,
                            height: double.infinity,
                            decoration: BoxDecoration(
                              color: Color(0xFF9B06EC),
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
                              borderRadius: BorderRadius.only(
                                bottomLeft: Radius.circular(0.0),
                                bottomRight: Radius.circular(12.0),
                                topLeft: Radius.circular(0.0),
                                topRight: Radius.circular(12.0),
                              ),
                            ),
                            child: Column(
                              mainAxisSize: MainAxisSize.max,
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                FaIcon(
                                  FontAwesomeIcons.solidHandPointRight,
                                  color:
                                      FlutterFlowTheme.of(context).colorWhite,
                                  size: 20.0,
                                ),
                                Padding(
                                  padding: EdgeInsetsDirectional.fromSTEB(
                                      0.0, 2.0, 0.0, 0.0),
                                  child: Text(
                                    'Go to Gate',
                                    textAlign: TextAlign.center,
                                    style: FlutterFlowTheme.of(context)
                                        .bodyMedium
                                        .override(
                                          fontFamily:
                                              FlutterFlowTheme.of(context)
                                                  .bodyMediumFamily,
                                          color: FlutterFlowTheme.of(context)
                                              .colorWhite,
                                          fontSize: 10.0,
                                          letterSpacing: 0.0,
                                          fontWeight: FontWeight.w300,
                                          useGoogleFonts:
                                              !FlutterFlowTheme.of(context)
                                                  .bodyMediumIsCustom,
                                        ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        );
                      } else {
                        return Container(
                          width: 60.0,
                          height: double.infinity,
                          decoration: BoxDecoration(
                            color: FlutterFlowTheme.of(context)
                                .secondaryBackground,
                            borderRadius: BorderRadius.only(
                              bottomLeft: Radius.circular(0.0),
                              bottomRight: Radius.circular(12.0),
                              topLeft: Radius.circular(0.0),
                              topRight: Radius.circular(12.0),
                            ),
                          ),
                          child: Column(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              FaIcon(
                                FontAwesomeIcons.ellipsisV,
                                color:
                                    FlutterFlowTheme.of(context).secondaryText,
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
        ),
      ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!),
    );
  }
}
