import React, {useEffect, useState} from 'react';
import {
  Animated,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import {showMessage} from '../components/MessageBox';
import {Button} from '../components/Button';
import {ChatInputBar} from '../components/ChatInputBar';
import {PlayerMatchup} from '../components/PlayerMatchup';
import {BOARD_SIZE, findAt, isDarkSquare} from '../game/checkers';
import {useGameBoard} from '../hooks/useGameBoard';
import {useGameChat} from '../hooks/useGameChat';
import {useAndroidBack} from '../navigation/useAndroidBack';
import {styles} from '../styles/checkersBoardStyles';
import type {ChatMessage} from '../hooks/useGameChat';
import type {LoginResponse} from '../types/auth';
import type {GameResponse} from '../types/game';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface CheckersBoardScreenProps {
  game: GameResponse;
  session: LoginResponse;
  onBack: () => void;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export function CheckersBoardScreen({game, session, onBack}: CheckersBoardScreenProps) {
  const {t} = useTranslation();
  const {
    game: liveGame,
    engine,
    myColor,
    isFlipped,
    myUsername,
    opponentUsername,
    myAvatarUrl,
    opponentAvatarUrl,
    isMyTurn,
    spectator,
    timeLeft,
    isTimerActive,
    isUrgent,
    winner,
    watchersCount,
    sendingMove,
    error,
    boardSize,
    cellSize,
    getAnim,
    darkCount,
    lightCount,
    handleCellPress,
    handleResign,
  } = useGameBoard(game, session);

  const {
    reversedMessages,
    text,
    showMentions,
    filteredPlayers,
    canSend,
    inputRef,
    listRef,
    handleSend,
    handleTextChange,
    insertMention,
  } = useGameChat(session, liveGame);

  const {
    pieces,
    mustCapture,
    pendingCaptureId,
    activeId,
    selectedPiece,
    validMoveMap,
    capturingPieceIds,
  } = engine;

  const capturingSet = new Set(capturingPieceIds);
  const pieceSize = Math.round(cellSize * 0.78);
  const pieceOffset = (cellSize - pieceSize) / 2;

  const myCount = myColor === 'dark' ? darkCount : lightCount;
  const oppCount = myColor === 'dark' ? lightCount : darkCount;

  const displayColor = (gameColor: 'dark' | 'light') =>
    isFlipped ? (gameColor === 'dark' ? 'light' : 'dark') : gameColor;

  const isDarkTurn = liveGame.currentTurn === 'Black';

  // Left chip: black player in spectator mode, or "me" in participant mode.
  // Right chip: white player in spectator mode, or opponent in participant mode.
  const leftPieceColor: 'dark' | 'light' = spectator ? 'dark' : myColor ?? 'dark';
  const rightPieceColor: 'dark' | 'light' = leftPieceColor === 'dark' ? 'light' : 'dark';

  const leftUsername = spectator ? liveGame.playerBlackUsername : myUsername;
  const rightUsername = spectator ? liveGame.playerWhiteUsername : opponentUsername;
  const leftAvatarUrl = spectator ? liveGame.playerBlackAvatarUrl : myAvatarUrl;
  const rightAvatarUrl = spectator ? liveGame.playerWhiteAvatarUrl : opponentAvatarUrl;
  const leftLabel = spectator ? t('checkersBoard.playerBlack') : t('checkersBoard.you');
  const rightLabel = spectator ? t('checkersBoard.playerWhite') : t('checkersBoard.opponent');
  const leftCount = spectator ? darkCount : myCount;
  const rightCount = spectator ? lightCount : oppCount;
  const leftActive = spectator ? (isDarkTurn && !winner) : (isMyTurn && !winner);
  const rightActive = spectator ? (!isDarkTurn && !winner) : (!isMyTurn && !winner);

  const statusText = () => {
    if (spectator) {
      if (winner) {
        const winnerName = liveGame.winnerId === liveGame.playerBlackId
          ? liveGame.playerBlackUsername
          : liveGame.playerWhiteUsername;
        return t('checkersBoard.spectatorWinner', {winner: winnerName ?? 'Jogador'});
      }
      const turnName = isDarkTurn ? liveGame.playerBlackUsername : liveGame.playerWhiteUsername;
      return t('checkersBoard.spectatorTurn', {name: turnName ?? 'jogador'});
    }
    if (winner) {
      return winner === myColor ? t('checkersBoard.youWon') : t('checkersBoard.youLost');
    }
    if (sendingMove) {return t('checkersBoard.sendingMove');}
    if (pendingCaptureId) {return t('checkersBoard.multiCapture');}
    if (mustCapture) {return t('checkersBoard.mandatoryCapture');}
    return isMyTurn
      ? t('checkersBoard.yourTurn')
      : t('checkersBoard.opponentTurn', {name: opponentUsername ?? 'oponente'});
  };

  const confirmResign = () => {
    showMessage({
      title: t('checkersBoard.resignConfirm.title'),
      message: t('checkersBoard.resignConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('checkersBoard.resignConfirm.cancel')},
        {label: t('checkersBoard.resignConfirm.resign'), danger: true, onPress: handleResign},
      ],
    });
  };

  const confirmResignAndLeave = () => {
    showMessage({
      title: t('checkersBoard.resignConfirm.title'),
      message: t('checkersBoard.resignConfirm.message'),
      type: 'confirm',
      actions: [
        {label: t('checkersBoard.resignConfirm.cancel')},
        {
          label: t('checkersBoard.resignConfirm.resign'),
          danger: true,
          onPress: async () => {
            await handleResign();
            onBack();
          },
        },
      ],
    });
  };

  // Android back button: ask to resign if game is active, otherwise navigate back
  useAndroidBack(() => {
    if (winner || spectator || liveGame.status !== 'InProgress') {
      onBack();
      return true;
    }
    confirmResignAndLeave();
    return true;
  });

  // Track keyboard height on both platforms.
  // adjustNothing in AndroidManifest means the OS never resizes the window,
  // so we control the layout manually via keyboard events on both platforms.
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [inputBarHeight, setInputBarHeight] = useState(60);
  useEffect(() => {
    const show = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      e => setKeyboardHeight(e.endCoordinates.height + 12),
    );
    const hide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardHeight(0),
    );
    return () => { show.remove(); hide.remove(); };
  }, []);

  const showResignBar = liveGame.status === 'InProgress' && !winner;

  return (
    <View style={styles.container} testID="game-screen">

      {/* Player chips */}
      <View style={styles.topSection}>
        <PlayerMatchup
          left={{
            username: leftUsername,
            avatarUrl: leftAvatarUrl,
            label: leftLabel,
            count: leftCount,
            isActive: leftActive,
            pieceColor: leftPieceColor,
          }}
          right={{
            username: rightUsername,
            avatarUrl: rightAvatarUrl,
            label: rightLabel,
            count: rightCount,
            isActive: rightActive,
            pieceColor: rightPieceColor,
          }}
          center={
            <View style={styles.onlinePill}>
              <View style={styles.onlineDot} />
              <Text style={styles.vsText} testID="watchers-count">
                {watchersCount}
              </Text>
            </View>
          }
        />
      </View>

      {/* Board section */}
      <View style={styles.boardSection}>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={[styles.boardFrame, {width: boardSize + 20, height: boardSize + 20}]}>
          <View
            style={[
              styles.board,
              {width: boardSize, height: boardSize},
              isFlipped && styles.boardFlipped,
            ]}
            testID="checkers-board">

            {/* Layer 1: Cell grid */}
            <View style={[StyleSheet.absoluteFillObject, styles.cellGrid]}>
              {Array.from({length: BOARD_SIZE}, (_, row) =>
                Array.from({length: BOARD_SIZE}, (_, col) => {
                  const dark = isDarkSquare(row, col);
                  const isTarget = validMoveMap.has(`${row}-${col}`);
                  const hasPiece = !!findAt(pieces, row, col);
                  const isSelectedCell =
                    selectedPiece?.row === row && selectedPiece?.col === col;
                  return (
                    <Pressable
                      key={`${row}-${col}`}
                      testID={`cell-${row}-${col}`}
                      style={[
                        {width: cellSize, height: cellSize},
                        dark ? styles.darkCell : styles.lightCell,
                        isSelectedCell && styles.selectedCell,
                      ]}
                      onPress={() => handleCellPress(row, col)}>
                      {isTarget && !hasPiece && <View style={styles.targetDot} />}
                      {isTarget && hasPiece && <View style={styles.captureRing} />}
                    </Pressable>
                  );
                }),
              )}
            </View>

            {/* Layer 2: Animated pieces */}
            <View
              style={[
                StyleSheet.absoluteFillObject,
                // eslint-disable-next-line react-native/no-inline-styles
                {pointerEvents: 'none'},
              ]}>
              {pieces.map(piece => {
                const anim = getAnim(piece);
                const isSelected = piece.id === activeId;
                const isMandatory = !isSelected && capturingSet.has(piece.id);
                const visColor = displayColor(piece.color);
                return (
                  <Animated.View
                    key={piece.id}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: cellSize,
                      height: cellSize,
                      alignItems: 'center',
                      justifyContent: 'center',
                      transform: [
                        {translateX: anim.pos.x},
                        {translateY: anim.pos.y},
                        ...(isFlipped ? [{rotate: '180deg'}] : []),
                      ],
                      opacity: anim.opacity,
                    }}>
                    <View
                      testID={piece.color === 'dark' ? 'piece-dark' : 'piece-light'}
                      style={[
                        styles.piece,
                        {width: pieceSize, height: pieceSize, borderRadius: pieceSize / 2},
                        visColor === 'dark' ? styles.darkPiece : styles.lightPiece,
                        isSelected && styles.selectedPiece,
                      ]}>
                      <View
                        style={[
                          styles.pieceShine,
                          {width: pieceSize * 0.42, height: pieceSize * 0.42, borderRadius: pieceSize * 0.21},
                          visColor === 'dark' ? styles.darkShine : styles.lightShine,
                        ]}
                      />
                      {piece.isKing && (
                        <Text
                          style={[
                            styles.crown,
                            visColor === 'dark' ? styles.darkCrown : styles.lightCrown,
                          ]}>
                          ♛
                        </Text>
                      )}
                    </View>
                    {isSelected && (
                      <View
                        style={[
                          styles.selectionRing,
                          {
                            width: pieceSize + 10,
                            height: pieceSize + 10,
                            borderRadius: (pieceSize + 10) / 2,
                            top: pieceOffset - 5,
                            left: pieceOffset - 5,
                          },
                        ]}
                      />
                    )}
                    {isMandatory && (
                      <View
                        style={[
                          styles.mandatoryRing,
                          {
                            width: pieceSize + 10,
                            height: pieceSize + 10,
                            borderRadius: (pieceSize + 10) / 2,
                            top: pieceOffset - 5,
                            left: pieceOffset - 5,
                          },
                        ]}
                      />
                    )}
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Status + timer — always visible when game is active */}
        <View style={styles.statusRow}>
          <Text
            style={[styles.statusLabel, isUrgent && styles.statusUrgent]}
            testID="status-text"
            numberOfLines={1}>
            {statusText()}
          </Text>
          {isTimerActive && (
            <View style={[styles.timerBadge, isUrgent && styles.timerBadgeUrgent]}>
              <Text
                style={[styles.timerText, isUrgent && styles.timerUrgent]}
                testID="turn-timer">
                {timeLeft}s
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Chat messages — fills remaining space, padded so content isn't hidden behind input bar */}
      <FlatList<ChatMessage>
        ref={listRef}
        inverted
        data={reversedMessages}
        keyExtractor={item => item.id}
        style={styles.chatSection}
        contentContainerStyle={[styles.chatList, {paddingTop: inputBarHeight}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <View style={styles.chatEmpty}>
            <Text style={styles.chatEmptyText} testID="chat-empty">
              {t('chat.empty')}
            </Text>
          </View>
        }
        renderItem={item => 
          <ChatMessageItem
            item={item.item}
            myPlayerId={session.playerId}
            myUsername={session.username}
          />
        }
      />

      {/* Input bar — absolutely positioned, floats above keyboard */}
      <View
        style={[styles.inputBar, {bottom: keyboardHeight}]}
        onLayout={e => setInputBarHeight(e.nativeEvent.layout.height)}>

        {/* Resign / Leave */}
        {showResignBar && (
          <View style={styles.resignBar}>
            {spectator ? (
              <Pressable
                style={styles.leavePill}
                onPress={onBack}
                testID="leave-button">
                <Text style={styles.leavePillText}>{t('checkersBoard.leaveButton')}</Text>
              </Pressable>
            ) : (
              <Pressable
                style={styles.resignPill}
                onPress={confirmResign}
                testID="resign-button">
                <Text style={styles.resignPillText}>{t('checkersBoard.resignButton')}</Text>
              </Pressable>
            )}
          </View>
        )}

        {/* Chat input */}
        <ChatInputBar
          text={text}
          canSend={canSend}
          showMentions={showMentions}
          filteredPlayers={filteredPlayers}
          inputRef={inputRef}
          placeholder={t('chat.inputPlaceholder')}
          onChangeText={handleTextChange}
          onSend={handleSend}
          onInsertMention={insertMention}
        />
      </View>

      {/* Win / loss overlay */}
      {winner && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            {spectator ? (() => {
              const winnerName = (liveGame.winnerId === liveGame.playerBlackId
                ? liveGame.playerBlackUsername
                : liveGame.playerWhiteUsername) ?? 'Jogador';
              const loserName = (liveGame.resignedByPlayerId === liveGame.playerBlackId
                ? liveGame.playerBlackUsername
                : liveGame.playerWhiteUsername) ?? 'Jogador';
              const isResign = !!liveGame.resignedByPlayerId;
              return (
                <>
                  <Text style={styles.overlayEmoji}>🏆</Text>
                  <Text style={[styles.overlayHeading, styles.winColor]}>
                    {t('checkersBoard.spectatorEnd.title')}
                  </Text>
                  <Text style={styles.overlaySubtitle}>
                    {isResign
                      ? t('checkersBoard.spectatorEnd.resignMessage', {loser: loserName, winner: winnerName})
                      : t('checkersBoard.spectatorEnd.message', {winner: winnerName})}
                  </Text>
                </>
              );
            })() : (() => {
              const iWon = winner === myColor;
              const iResigned = liveGame.resignedByPlayerId === session.playerId;
              const opponentResigned = !!liveGame.resignedByPlayerId && !iResigned;
              return (
                <>
                  <Text style={styles.overlayEmoji}>{iWon ? '🏆' : '💔'}</Text>
                  <Text style={[styles.overlayHeading, iWon ? styles.winColor : styles.lossColor]}>
                    {iWon
                      ? t('checkersBoard.participantEnd.winTitle')
                      : t('checkersBoard.participantEnd.lossTitle')}
                  </Text>
                  <Text style={styles.overlaySubtitle}>
                    {iWon && opponentResigned
                      ? t('checkersBoard.participantEnd.winByResignMessage', {opponent: opponentUsername ?? 'Adversário'})
                      : !iWon && iResigned
                      ? t('checkersBoard.participantEnd.resignedMessage')
                      : iWon
                      ? t('checkersBoard.participantEnd.winMessage')
                      : t('checkersBoard.participantEnd.lossMessage', {opponent: opponentUsername ?? 'Adversário'})}
                  </Text>
                </>
              );
            })()}
            <View style={styles.overlayActions}>
              <Button
                label={t('checkersBoard.backToHome')}
                onPress={onBack}
                testID="overlay-back-button"
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
