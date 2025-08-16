import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import '/index.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'c_home_entries_card_model.dart';
export 'c_home_entries_card_model.dart';

class CHomeEntriesCardWidget extends StatefulWidget {
  const CHomeEntriesCardWidget({
    super.key,
    this.cpArmband,
    this.cpCallName,
    this.cpBreed,
    this.cpHandler,
    required this.cpIndex,
  });

  final int? cpArmband;
  final String? cpCallName;
  final String? cpBreed;
  final String? cpHandler;
  final int? cpIndex;

  @override
  State<CHomeEntriesCardWidget> createState() => _CHomeEntriesCardWidgetState();
}

class _CHomeEntriesCardWidgetState extends State<CHomeEntriesCardWidget>
    with TickerProviderStateMixin {
  late CHomeEntriesCardModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CHomeEntriesCardModel());

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
      'iconOnPageLoadAnimation': AnimationInfo(
        reverse: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ScaleEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 600.0.ms,
            begin: Offset(0.9, 0.9),
            end: Offset(1.0, 1.0),
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

    return InkWell(
      splashColor: Colors.transparent,
      focusColor: Colors.transparent,
      hoverColor: Colors.transparent,
      highlightColor: Colors.transparent,
      onTap: () async {
        HapticFeedback.heavyImpact();

        context.pushNamed(
          PEntryListAllWidget.routeName,
          queryParameters: {
            'ppArmband': serializeParam(
              widget.cpArmband,
              ParamType.int,
            ),
            'ppCallName': serializeParam(
              widget.cpCallName,
              ParamType.String,
            ),
            'ppBreed': serializeParam(
              widget.cpBreed,
              ParamType.String,
            ),
            'ppHandler': serializeParam(
              widget.cpHandler,
              ParamType.String,
            ),
          }.withoutNulls,
        );
      },
      child: Material(
        color: Colors.transparent,
        elevation: 3.0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.0),
        ),
        child: Container(
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
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              Row(
                mainAxisSize: MainAxisSize.max,
                children: [
                  Padding(
                    padding: EdgeInsets.all(8.0),
                    child: Material(
                      color: Colors.transparent,
                      elevation: 5.0,
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
                          widget.cpArmband!.toString(),
                          textAlign: TextAlign.center,
                          style: FlutterFlowTheme.of(context)
                              .bodyMedium
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodyMediumFamily,
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
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisSize: MainAxisSize.max,
                          mainAxisAlignment: MainAxisAlignment.start,
                          children: [
                            Expanded(
                              child: AnimatedDefaultTextStyle(
                                style: FlutterFlowTheme.of(context)
                                    .bodySmall
                                    .override(
                                      fontFamily: FlutterFlowTheme.of(context)
                                          .bodySmallFamily,
                                      color:
                                          FlutterFlowTheme.of(context).primary,
                                      fontSize: 14.0,
                                      letterSpacing: 0.0,
                                      fontWeight: FontWeight.w600,
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodySmallIsCustom,
                                    ),
                                duration: Duration(milliseconds: 600),
                                curve: Curves.easeIn,
                                child: Text(
                                  widget.cpCallName!.maybeHandleOverflow(
                                    maxChars: 35,
                                    replacement: '…',
                                  ),
                                ),
                              ),
                            ),
                            if (FFAppState()
                                .asFavorite
                                .contains(widget.cpArmband))
                              Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 8.0, 0.0),
                                child: InkWell(
                                  splashColor: Colors.transparent,
                                  focusColor: Colors.transparent,
                                  hoverColor: Colors.transparent,
                                  highlightColor: Colors.transparent,
                                  onTap: () async {
                                    FFAppState().removeFromAsFavorite(
                                        widget.cpArmband!);
                                    safeSetState(() {});
                                  },
                                  child: Icon(
                                    Icons.favorite,
                                    color:
                                        FlutterFlowTheme.of(context).alternate,
                                    size: 24.0,
                                  ),
                                ).animateOnPageLoad(
                                    animationsMap['iconOnPageLoadAnimation']!),
                              ),
                            if (!FFAppState()
                                .asFavorite
                                .contains(widget.cpArmband))
                              Padding(
                                padding: EdgeInsetsDirectional.fromSTEB(
                                    0.0, 0.0, 8.0, 0.0),
                                child: InkWell(
                                  splashColor: Colors.transparent,
                                  focusColor: Colors.transparent,
                                  hoverColor: Colors.transparent,
                                  highlightColor: Colors.transparent,
                                  onTap: () async {
                                    FFAppState()
                                        .addToAsFavorite(widget.cpArmband!);
                                    safeSetState(() {});
                                  },
                                  child: Icon(
                                    Icons.favorite_border,
                                    color: FlutterFlowTheme.of(context).accent3,
                                    size: 24.0,
                                  ),
                                ),
                              ),
                          ].divide(SizedBox(width: 4.0)),
                        ),
                        Text(
                          widget.cpBreed!.maybeHandleOverflow(
                            maxChars: 40,
                            replacement: '…',
                          ),
                          style: FlutterFlowTheme.of(context)
                              .bodySmall
                              .override(
                                fontFamily: FlutterFlowTheme.of(context)
                                    .bodySmallFamily,
                                fontSize: 12.0,
                                letterSpacing: 0.0,
                                fontWeight: FontWeight.w500,
                                useGoogleFonts: !FlutterFlowTheme.of(context)
                                    .bodySmallIsCustom,
                              ),
                        ),
                        Padding(
                          padding: EdgeInsetsDirectional.fromSTEB(
                              0.0, 0.0, 8.0, 4.0),
                          child: Row(
                            mainAxisSize: MainAxisSize.max,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                widget.cpHandler!,
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
                                      useGoogleFonts:
                                          !FlutterFlowTheme.of(context)
                                              .bodyMediumIsCustom,
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
            ],
          ),
        ),
      ),
    ).animateOnPageLoad(animationsMap['containerOnPageLoadAnimation']!);
  }
}
