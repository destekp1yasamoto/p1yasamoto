begin;

-- Kullanıcıya bağlı yüklenmiş medya kayıtlarını temizle.
delete from storage.objects
where bucket_id in ('avatars', 'listing-photos');

-- Tüm auth kullanıcılarını sil.
-- profiles tablosu auth.users'a bağlı olduğu için,
-- kullanıcıya bağlı public veriler cascade ile temizlenir.
delete from auth.users;

commit;
