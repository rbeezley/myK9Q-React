import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'c_loading_classes_model.dart';
export 'c_loading_classes_model.dart';

class CLoadingClassesWidget extends StatefulWidget {
  const CLoadingClassesWidget({super.key});

  @override
  State<CLoadingClassesWidget> createState() => _CLoadingClassesWidgetState();
}

class _CLoadingClassesWidgetState extends State<CLoadingClassesWidget>
    with TickerProviderStateMixin {
  late CLoadingClassesModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CLoadingClassesModel());

    animationsMap.addAll({
      'columnOnPageLoadAnimation': AnimationInfo(
        loop: true,
        trigger: AnimationTrigger.onPageLoad,
        effectsBuilder: () => [
          ShimmerEffect(
            curve: Curves.easeInOut,
            delay: 0.0.ms,
            duration: 1250.0.ms,
            color: FlutterFlowTheme.of(context).primary,
            angle: -1.047,
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
    return Column(
      mainAxisSize: MainAxisSize.max,
      children: [
        Material(
          color: Colors.transparent,
          elevation: 3.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Container(
            height: 174.0,
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
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                Container(
                  width: 80.0,
                  height: 174.0,
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondary,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(12.0),
                      bottomRight: Radius.circular(0.0),
                      topLeft: Radius.circular(12.0),
                      topRight: Radius.circular(0.0),
                    ),
                    shape: BoxShape.rectangle,
                  ),
                  alignment: AlignmentDirectional(0.0, 0.1),
                ),
              ],
            ),
          ),
        ),
        Material(
          color: Colors.transparent,
          elevation: 3.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Container(
            height: 174.0,
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
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                Container(
                  width: 80.0,
                  height: 174.0,
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondary,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(12.0),
                      bottomRight: Radius.circular(0.0),
                      topLeft: Radius.circular(12.0),
                      topRight: Radius.circular(0.0),
                    ),
                    shape: BoxShape.rectangle,
                  ),
                  alignment: AlignmentDirectional(0.0, 0.1),
                ),
              ],
            ),
          ),
        ),
        Material(
          color: Colors.transparent,
          elevation: 3.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: Container(
            height: 174.0,
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
            child: Row(
              mainAxisSize: MainAxisSize.max,
              children: [
                Container(
                  width: 80.0,
                  height: 174.0,
                  decoration: BoxDecoration(
                    color: FlutterFlowTheme.of(context).secondary,
                    borderRadius: BorderRadius.only(
                      bottomLeft: Radius.circular(12.0),
                      bottomRight: Radius.circular(0.0),
                      topLeft: Radius.circular(12.0),
                      topRight: Radius.circular(0.0),
                    ),
                    shape: BoxShape.rectangle,
                  ),
                  alignment: AlignmentDirectional(0.0, 0.1),
                ),
              ],
            ),
          ),
        ),
      ].divide(SizedBox(height: 4.0)).around(SizedBox(height: 4.0)),
    ).animateOnPageLoad(animationsMap['columnOnPageLoadAnimation']!);
  }
}
