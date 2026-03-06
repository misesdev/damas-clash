import {useState} from 'react';
import {launchImageLibrary} from 'react-native-image-picker';
import {showMessage} from '../components/MessageBox';
import {updateAvatar} from '../api/players';
import type {LoginResponse} from '../types/auth';

export function useProfileScreen(
  user: LoginResponse,
  onLogout: () => void,
  onAvatarChanged: (url: string) => void,
) {
  const [uploading, setUploading] = useState(false);

  const handleLogout = () => {
    showMessage({
      title: 'Encerrar sessão',
      message: 'Deseja sair da sua conta?',
      type: 'confirm',
      actions: [
        {label: 'Cancelar'},
        {label: 'Sair', danger: true, onPress: onLogout},
      ],
    });
  };

  const handleAvatarPress = () => {
    launchImageLibrary(
      {mediaType: 'photo', quality: 0.8, maxWidth: 800, maxHeight: 800},
      async response => {
        if (response.didCancel || response.errorCode) {return;}
        const asset = response.assets?.[0];
        if (!asset?.uri) {return;}

        setUploading(true);
        try {
          const url = await updateAvatar(
            user.token,
            user.playerId,
            asset.uri,
            asset.fileName ?? 'avatar.jpg',
            asset.type ?? 'image/jpeg',
          );
          onAvatarChanged(url);
        } catch (e: any) {
          showMessage({
            title: 'Erro',
            message: e.message ?? 'Não foi possível enviar a imagem.',
            type: 'error',
          });
        } finally {
          setUploading(false);
        }
      },
    );
  };

  return {uploading, handleLogout, handleAvatarPress};
}
