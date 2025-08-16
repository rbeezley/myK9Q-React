import '/backend/supabase/supabase.dart';
import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_choice_chips.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/flutter_flow/flutter_flow_widgets.dart';
import '/flutter_flow/form_field_controller.dart';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_spinkit/flutter_spinkit.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:provider/provider.dart';
import 'c_class_settings_model.dart';
export 'c_class_settings_model.dart';

class CClassSettingsWidget extends StatefulWidget {
  const CClassSettingsWidget({
    super.key,
    required this.cpClassRow,
    this.cpTrialRow,
  });

  final TblClassQueueRow? cpClassRow;
  final TblTrialQueueRow? cpTrialRow;

  @override
  State<CClassSettingsWidget> createState() => _CClassSettingsWidgetState();
}

class _CClassSettingsWidgetState extends State<CClassSettingsWidget>
    with TickerProviderStateMixin {
  late CClassSettingsModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CClassSettingsModel());

    // On component load action.
    SchedulerBinding.instance.addPostFrameCallback((_) async {
      if (widget.cpClassRow?.element == 'Container') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else if (widget.cpClassRow?.element == 'Buried') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else if ((widget.cpClassRow?.element == 'Handler Discrimination') &&
          (widget.cpClassRow?.level == 'Novice')) {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      } else {
        FFAppState().asReadOnly = false;
        safeSetState(() {});
      }

      if (FFAppState().asRole == 'Exhibitor') {
        FFAppState().asReadOnly = true;
        safeSetState(() {});
      }
    });

    _model.textFieldCommentTextController ??=
        TextEditingController(text: widget.cpClassRow?.classStatusComment);
    _model.textFieldCommentFocusNode ??= FocusNode();

    animationsMap.addAll({
      'containerOnPageLoadAnimation': AnimationInfo(
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          FadeEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: 0.0,
            end: 1.0,
          ),
          TiltEffect(
            curve: Curves.easeInOut,
            delay: 100.0.ms,
            duration: 600.0.ms,
            begin: Offset(0, 0.698),
            end: Offset(0, 0),
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

    return Align(
      alignment: AlignmentDirectional(0.0, 0.0),
      child: Padding(
        padding: EdgeInsets.all(8.0),
        child: FutureBuilder<List<TblClassQueueRow>>(
          future: TblClassQueueTable().querySingleRow(
            queryFn: (q) => q.eqOrNull(
              'classid',
              widget.cpClassRow?.classid,
            ),
          ),
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
            List<TblClassQueueRow> containerQueryTblClassQueueRowList =
                snapshot.data!;

            final containerQueryTblClassQueueRow =
                containerQueryTblClassQueueRowList.isNotEmpty
                    ? containerQueryTblClassQueueRowList.first
                    : null;

            return Container(
              width: 300.0,
              height: 472.0,
              constraints: BoxConstraints(
                maxWidth: 600.0,
              ),
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
              child: Padding(
                padding: EdgeInsets.all(8.0),
                child: Column(
                  mainAxisSize: MainAxisSize.max,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding:
                          EdgeInsetsDirectional.fromSTEB(0.0, 0.0, 0.0, 8.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        children: [
                          Padding(
                            padding: EdgeInsetsDirectional.fromSTEB(
                                0.0, 0.0, 8.0, 0.0),
                            child: Icon(
                              Icons.settings_sharp,
                              color: FlutterFlowTheme.of(context).primary,
                              size: 24.0,
                            ),
                          ),
                          Text(
                            'Class Settings',
                            textAlign: TextAlign.start,
                            style: FlutterFlowTheme.of(context)
                                .labelMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .labelMediumFamily,
                                  fontSize: 14.0,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .labelMediumIsCustom,
                                ),
                          ),
                        ],
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      mainAxisAlignment: MainAxisAlignment.start,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Padding(
                          padding: EdgeInsets.all(4.0),
                          child: Text(
                            '${widget.cpClassRow?.element} ${widget.cpClassRow?.level}',
                            style: FlutterFlowTheme.of(context)
                                .bodyMedium
                                .override(
                                  fontFamily: FlutterFlowTheme.of(context)
                                      .bodyMediumFamily,
                                  letterSpacing: 0.0,
                                  useGoogleFonts: !FlutterFlowTheme.of(context)
                                      .bodyMediumIsCustom,
                                ),
                          ),
                        ),
                      ],
                    ),
                    Divider(
                      thickness: 1.0,
                      color: FlutterFlowTheme.of(context).accent2,
                    ),
                    Padding(
                      padding: EdgeInsets.all(8.0),
                      child: TextFormField(
                        controller: _model.textFieldCommentTextController,
                        focusNode: _model.textFieldCommentFocusNode,
                        autofocus: true,
                        obscureText: false,
                        decoration: InputDecoration(
                          labelText:
                              'Additional Comment for Status such as Start\\End Time',
                          labelStyle: FlutterFlowTheme.of(context)
                              .labelMedium
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .labelMediumFamily,
                                letterSpacing: 0.0,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .labelMediumIsCustom,
                              ),
                          hintStyle: FlutterFlowTheme.of(context)
                              .labelMedium
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .labelMediumFamily,
                                letterSpacing: 0.0,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .labelMediumIsCustom,
                              ),
                          enabledBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: FlutterFlowTheme.of(context).primary,
                              width: 2.0,
                            ),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: FlutterFlowTheme.of(context).tertiary,
                              width: 2.0,
                            ),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          errorBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: FlutterFlowTheme.of(context).error,
                              width: 2.0,
                            ),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                          focusedErrorBorder: OutlineInputBorder(
                            borderSide: BorderSide(
                              color: FlutterFlowTheme.of(context).error,
                              width: 2.0,
                            ),
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                        ),
                        style: FlutterFlowTheme.of(context).bodyMedium.override(
                              fontFamily:
                                  FlutterFlowTheme.of(context).bodyMediumFamily,
                              letterSpacing: 0.0,
                              useGoogleFonts: !FlutterFlowTheme.of(context)
                                  .bodyMediumIsCustom,
                            ),
                        validator: _model
                            .textFieldCommentTextControllerValidator
                            .asValidator(context),
                      ),
                    ),
                    Divider(
                      thickness: 1.0,
                      color: FlutterFlowTheme.of(context).accent2,
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.max,
                      children: [
                        Expanded(
                          child: Padding(
                            padding: EdgeInsets.all(4.0),
                            child: FlutterFlowChoiceChips(
                              options: [
                                ChipData('None', FontAwesomeIcons.ellipsisV),
                                ChipData('Setup', Icons.build),
                                ChipData('Briefing', Icons.message_outlined),
                                ChipData(
                                    'Break', Icons.free_breakfast_outlined),
                                ChipData(
                                    'Start Time', Icons.access_time_rounded),
                                ChipData('In Progress', FFIcons.krunningdog),
                                ChipData(
                                    'Completed', FontAwesomeIcons.flagCheckered)
                              ],
                              onChanged: (val) => safeSetState(() =>
                                  _model.classStatusValue = val?.firstOrNull),
                              selectedChipStyle: ChipStyle(
                                backgroundColor: FlutterFlowTheme.of(context)
                                    .backgroundComponents,
                                textStyle: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodySmallFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .colorWhite,
                                      fontSize: 12.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.w500,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodySmallIsCustom,
                                    ),
                                iconColor:
                                    FlutterFlowTheme.of(context).colorWhite,
                                iconSize: 14.0,
                                labelPadding: EdgeInsets.all(4.0),
                                elevation: 3.0,
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              unselectedChipStyle: ChipStyle(
                                backgroundColor: FlutterFlowTheme.of(context)
                                    .primaryBackground,
                                textStyle: FlutterFlowTheme.of(context)
                                    .bodyMedium
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodyMediumFamily,
                                      color: FlutterFlowTheme.of(context)
                                          .secondaryText,
                                      fontSize: 12.0,
                                      letterSpacing: 0.0,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
                                    ),
                                iconColor:
                                    FlutterFlowTheme.of(context).secondaryText,
                                iconSize: 14.0,
                                labelPadding: EdgeInsets.all(0.0),
                                elevation: 0.0,
                                borderRadius: BorderRadius.circular(12.0),
                              ),
                              chipSpacing: 0.0,
                              rowSpacing: 8.0,
                              multiselect: false,
                              alignment: WrapAlignment.start,
                              controller: _model.classStatusValueController ??=
                                  FormFieldController<List<String>>(
                                [],
                              ),
                              wrapped: true,
                            ),
                          ),
                        ),
                      ],
                    ),
                    Divider(
                      thickness: 1.0,
                      color: FlutterFlowTheme.of(context).accent2,
                    ),
                    if (FFAppState().asRole != 'Exhibitor')
                      Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Material(
                              color: Colors.transparent,
                              child: SwitchListTile.adaptive(
                                value: _model.enableSelfCheckInValue ??=
                                    containerQueryTblClassQueueRow!
                                        .selfCheckin!,
                                onChanged: (newValue) async {
                                  safeSetState(() => _model
                                      .enableSelfCheckInValue = newValue);
                                },
                                title: Text(
                                  'Enable Self Check-in',
                                  style: FlutterFlowTheme.of(context)
                                      .labelLarge
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .labelLargeFamily,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .labelLargeIsCustom,
                                      ),
                                ),
                                tileColor: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                activeColor:
                                    FlutterFlowTheme.of(context).tertiary,
                                activeTrackColor:
                                    FlutterFlowTheme.of(context).grayIcon,
                                dense: true,
                                controlAffinity:
                                    ListTileControlAffinity.trailing,
                              ),
                            ),
                          ),
                        ],
                      ),
                    if (FFAppState().asRole != 'Exhibitor')
                      Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Material(
                              color: Colors.transparent,
                              child: SwitchListTile.adaptive(
                                value: _model.enableRealtimeResultsValue ??=
                                    containerQueryTblClassQueueRow!
                                        .realtimeResults!,
                                onChanged: (newValue) async {
                                  safeSetState(() => _model
                                      .enableRealtimeResultsValue = newValue);
                                },
                                title: Text(
                                  'Enable Real-time Results',
                                  style: FlutterFlowTheme.of(context)
                                      .labelLarge
                                      .override(
                                        fontFamily: FlutterFlowTheme.of(context)
                                            .labelLargeFamily,
                                        letterSpacing: 0.0,
                                        useGoogleFonts:
                                            !FlutterFlowTheme.of(context)
                                                .labelLargeIsCustom,
                                      ),
                                ),
                                tileColor: FlutterFlowTheme.of(context)
                                    .secondaryBackground,
                                activeColor:
                                    FlutterFlowTheme.of(context).tertiary,
                                activeTrackColor:
                                    FlutterFlowTheme.of(context).grayIcon,
                                dense: true,
                                controlAffinity:
                                    ListTileControlAffinity.trailing,
                              ),
                            ),
                          ),
                        ],
                      ),
                    Divider(
                      thickness: 1.0,
                      color: FlutterFlowTheme.of(context).accent2,
                    ),
                    Padding(
                      padding: EdgeInsets.all(12.0),
                      child: Row(
                        mainAxisSize: MainAxisSize.max,
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          FFButtonWidget(
                            onPressed: () async {
                              HapticFeedback.heavyImpact();
                              Navigator.pop(context);
                            },
                            text: 'Cancel',
                            options: FFButtonOptions(
                              width: 100.0,
                              height: 40.0,
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              iconPadding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              color: FlutterFlowTheme.of(context)
                                  .secondaryBackground,
                              textStyle: FlutterFlowTheme.of(context)
                                  .bodyLarge
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyLargeFamily,
                                    letterSpacing: 0.0,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyLargeIsCustom,
                                  ),
                              elevation: 2.0,
                              borderSide: BorderSide(
                                color: FlutterFlowTheme.of(context).primary,
                                width: 1.0,
                              ),
                              borderRadius: BorderRadius.circular(40.0),
                            ),
                          ),
                          FFButtonWidget(
                            onPressed: (FFAppState().asRole == 'Exhibitor')
                                ? null
                                : () async {
                                    HapticFeedback.lightImpact();
                                    await TblClassQueueTable().update(
                                      data: {
                                        'self_checkin':
                                            _model.enableSelfCheckInValue,
                                        'realtime_results':
                                            _model.enableRealtimeResultsValue,
                                      },
                                      matchingRows: (rows) => rows
                                          .eqOrNull(
                                            'mobile_app_lic_key',
                                            widget.cpClassRow?.mobileAppLicKey,
                                          )
                                          .eqOrNull(
                                            'element',
                                            widget.cpClassRow?.element,
                                          )
                                          .eqOrNull(
                                            'level',
                                            widget.cpClassRow?.level,
                                          )
                                          .eqOrNull(
                                            'trial_date',
                                            widget.cpClassRow?.trialDate,
                                          )
                                          .eqOrNull(
                                            'trial_number',
                                            widget.cpClassRow?.trialNumber,
                                          ),
                                    );
                                    if (_model.classStatusValue == 'None') {
                                      await TblClassQueueTable().update(
                                        data: {
                                          'class_status': 0,
                                        },
                                        matchingRows: (rows) => rows.eqOrNull(
                                          'id',
                                          widget.cpClassRow?.id,
                                        ),
                                      );
                                    } else {
                                      if (_model.classStatusValue == 'Setup') {
                                        await TblClassQueueTable().update(
                                          data: {
                                            'class_status': 1,
                                          },
                                          matchingRows: (rows) => rows.eqOrNull(
                                            'id',
                                            widget.cpClassRow?.id,
                                          ),
                                        );
                                      } else {
                                        if (_model.classStatusValue ==
                                            'Briefing') {
                                          await TblClassQueueTable().update(
                                            data: {
                                              'class_status': 2,
                                            },
                                            matchingRows: (rows) =>
                                                rows.eqOrNull(
                                              'id',
                                              widget.cpClassRow?.id,
                                            ),
                                          );
                                        } else {
                                          if (_model.classStatusValue ==
                                              'Break') {
                                            await TblClassQueueTable().update(
                                              data: {
                                                'class_status': 3,
                                              },
                                              matchingRows: (rows) =>
                                                  rows.eqOrNull(
                                                'id',
                                                widget.cpClassRow?.id,
                                              ),
                                            );
                                          } else {
                                            if (_model.classStatusValue ==
                                                'Start Time') {
                                              await TblClassQueueTable().update(
                                                data: {
                                                  'class_status': 4,
                                                },
                                                matchingRows: (rows) =>
                                                    rows.eqOrNull(
                                                  'id',
                                                  widget.cpClassRow?.id,
                                                ),
                                              );
                                            } else {
                                              if (_model.classStatusValue ==
                                                  'In Progress') {
                                                await TblClassQueueTable()
                                                    .update(
                                                  data: {
                                                    'class_status': 5,
                                                  },
                                                  matchingRows: (rows) =>
                                                      rows.eqOrNull(
                                                    'id',
                                                    widget.cpClassRow?.id,
                                                  ),
                                                );
                                              } else {
                                                if (_model.classStatusValue ==
                                                    'Completed') {
                                                  await TblClassQueueTable()
                                                      .update(
                                                    data: {
                                                      'class_status': 6,
                                                    },
                                                    matchingRows: (rows) =>
                                                        rows.eqOrNull(
                                                      'id',
                                                      widget.cpClassRow?.id,
                                                    ),
                                                  );
                                                }
                                              }
                                            }
                                          }
                                        }
                                      }
                                    }

                                    await TblClassQueueTable().update(
                                      data: {
                                        'class_status_comment': _model
                                            .textFieldCommentTextController
                                            .text,
                                      },
                                      matchingRows: (rows) => rows.eqOrNull(
                                        'id',
                                        widget.cpClassRow?.id,
                                      ),
                                    );

                                    context.pushNamed(
                                      PClassListTabsWidget.routeName,
                                      queryParameters: {
                                        'ppTrialRow': serializeParam(
                                          widget.cpTrialRow,
                                          ParamType.SupabaseRow,
                                        ),
                                      }.withoutNulls,
                                    );

                                    Navigator.pop(context);

                                    safeSetState(() {});
                                  },
                            text: 'Save',
                            options: FFButtonOptions(
                              width: 100.0,
                              height: 40.0,
                              padding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              iconPadding: EdgeInsetsDirectional.fromSTEB(
                                  0.0, 0.0, 0.0, 0.0),
                              color: FlutterFlowTheme.of(context)
                                  .backgroundComponents,
                              textStyle: FlutterFlowTheme.of(context)
                                  .bodyLarge
                                  .override(
                                    fontFamily: FlutterFlowTheme.of(context)
                                        .bodyLargeFamily,
                                    color:
                                        FlutterFlowTheme.of(context).colorWhite,
                                    letterSpacing: 0.0,
                                    fontWeight: FontWeight.w600,
                                    useGoogleFonts:
                                        !FlutterFlowTheme.of(context)
                                            .bodyLargeIsCustom,
                                  ),
                              elevation: 2.0,
                              borderRadius: BorderRadius.circular(40.0),
                              disabledColor:
                                  FlutterFlowTheme.of(context).accent2,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!);
          },
        ),
      ),
    );
  }
}
