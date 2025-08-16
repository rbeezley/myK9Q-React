import '../database.dart';

class ViewUniqueMobileAppLicKeyTable
    extends SupabaseTable<ViewUniqueMobileAppLicKeyRow> {
  @override
  String get tableName => 'view_unique_mobile_app_lic_key';

  @override
  ViewUniqueMobileAppLicKeyRow createRow(Map<String, dynamic> data) =>
      ViewUniqueMobileAppLicKeyRow(data);
}

class ViewUniqueMobileAppLicKeyRow extends SupabaseDataRow {
  ViewUniqueMobileAppLicKeyRow(Map<String, dynamic> data) : super(data);

  @override
  SupabaseTable get table => ViewUniqueMobileAppLicKeyTable();

  String? get mobileAppLicKey => getField<String>('mobile_app_lic_key');
  set mobileAppLicKey(String? value) =>
      setField<String>('mobile_app_lic_key', value);

  String? get clubname => getField<String>('clubname');
  set clubname(String? value) => setField<String>('clubname', value);

  String? get org => getField<String>('org');
  set org(String? value) => setField<String>('org', value);

  String? get appVersion => getField<String>('app_version');
  set appVersion(String? value) => setField<String>('app_version', value);

  String? get showtype => getField<String>('showtype');
  set showtype(String? value) => setField<String>('showtype', value);
}
