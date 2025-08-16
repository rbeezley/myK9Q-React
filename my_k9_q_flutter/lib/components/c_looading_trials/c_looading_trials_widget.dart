import '/flutter_flow/flutter_flow_animations.dart';
import '/flutter_flow/flutter_flow_theme.dart';
import '/flutter_flow/flutter_flow_util.dart';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'c_looading_trials_model.dart';
export 'c_looading_trials_model.dart';

class CLooadingTrialsWidget extends StatefulWidget {
  const CLooadingTrialsWidget({super.key});

  @override
  State<CLooadingTrialsWidget> createState() => _CLooadingTrialsWidgetState();
}

class _CLooadingTrialsWidgetState extends State<CLooadingTrialsWidget>
    with TickerProviderStateMixin {
  late CLooadingTrialsModel _model;

  final animationsMap = <String, AnimationInfo>{};

  @override
  void setState(VoidCallback callback) {
    super.setState(callback);
    _model.onUpdate();
  }

  @override
  void initState() {
    super.initState();
    _model = createModel(context, () => CLooadingTrialsModel());

    animationsMap.addAll({
      'rowOnPageLoadAnimation': AnimationInfo(
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
    return Row(
      mainAxisSize: MainAxisSize.max,
      children: [
        Padding(
          padding: EdgeInsets.all(4.0),
          child: Material(
            color: Colors.transparent,
            elevation: 1.0,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12.0),
            ),
            child: AnimatedContainer(
              duration: Duration(milliseconds: 1100),
              curve: Curves.easeInOut,
              width: 160.0,
              height: 160.0,
              decoration: BoxDecoration(
                color: FlutterFlowTheme.of(context).secondaryBackground,
                boxShadow: [
                  BoxShadow(
                    blurRadius: 5.0,
                    color: Color(0x33000000),
                    offset: Offset(
                      0.0,
                      2.0,
                    ),
                  )
                ],
                borderRadius: BorderRadius.circular(12.0),
                shape: BoxShape.rectangle,
              ),
            ),
          ),
        ),
        Material(
          color: Colors.transparent,
          elevation: 1.0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12.0),
          ),
          child: AnimatedContainer(
            duration: Duration(milliseconds: 1100),
            curve: Curves.easeInOut,
            width: 160.0,
            height: 160.0,
            decoration: BoxDecoration(
              color: FlutterFlowTheme.of(context).secondaryBackground,
              boxShadow: [
                BoxShadow(
                  blurRadius: 5.0,
                  color: Color(0x33000000),
                  offset: Offset(
                    0.0,
                    2.0,
                  ),
                )
              ],
              borderRadius: BorderRadius.circular(12.0),
              shape: BoxShape.rectangle,
            ),
          ),
        ),
      ],
    ).animateOnPageLoad(animationsMap['rowOnPageLoadAnimation']!);
  }
}
