import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D0F14',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 32,
    alignItems: 'center',
    gap: 16,
  },

  // Header
  header: {alignItems: 'center', gap: 2},
  title: {
    color: '#F0EDE6',
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    color: '#8A90A0',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  watchers: {
    color: '#4A5068',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  // Score row
  scoreRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
  playerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#181C26',
    borderWidth: 1,
    borderColor: '#2A3042',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
    minWidth: 110,
    justifyContent: 'center',
  },
  activeChip: {borderColor: '#C9A84C', backgroundColor: '#1E1F15'},
  chipDot: {width: 10, height: 10, borderRadius: 5},
  lightDot: {backgroundColor: '#E8E0D0', borderWidth: 1, borderColor: '#B8AD9D'},
  darkDot: {backgroundColor: '#2A2F3C', borderWidth: 1, borderColor: '#1A1E28'},
  chipLabel: {color: '#9AA0B2', fontSize: 10, fontWeight: '600'},
  chipName: {color: '#E0DCD4', fontSize: 12, fontWeight: '700', maxWidth: 80},
  chipCount: {color: '#E0DCD4', fontSize: 15, fontWeight: '800', marginLeft: 4},
  vs: {color: '#3A4058', fontSize: 16, fontWeight: '700'},
  errorText: {color: '#C0392B', fontSize: 12, textAlign: 'center'},
  winnerText: {
    color: '#C9A84C',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 4,
  },

  // Board frame (wooden border effect)
  boardFrame: {
    borderRadius: 14,
    padding: 10,
    backgroundColor: '#2E1A0A',
    borderWidth: 2,
    borderColor: '#5A3515',
    shadowColor: '#000',
    shadowOpacity: 0.6,
    shadowOffset: {width: 0, height: 8},
    shadowRadius: 16,
    elevation: 12,
  },
  board: {borderRadius: 6, overflow: 'hidden'},

  // Cell grid layer
  cellGrid: {flexDirection: 'row', flexWrap: 'wrap'},

  // Individual cells
  lightCell: {backgroundColor: '#F0D9B5', alignItems: 'center', justifyContent: 'center'},
  darkCell: {backgroundColor: '#B58863', alignItems: 'center', justifyContent: 'center'},
  selectedCell: {backgroundColor: '#CDD16F'},

  // Move indicators
  targetDot: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.22)',
  },
  captureRing: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: 'rgba(220, 50, 50, 0.7)',
  },

  // Piece
  piece: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowOpacity: 0.45,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 4,
    elevation: 5,
  },
  darkPiece: {backgroundColor: '#1E2230', borderColor: '#0D0F18', shadowColor: '#000'},
  lightPiece: {backgroundColor: '#F4EEE2', borderColor: '#C8BCA8', shadowColor: '#555'},
  selectedPiece: {
    borderColor: '#D4A843',
    shadowColor: '#D4A843',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },

  // Shine ring inside piece
  pieceShine: {
    position: 'absolute',
    top: '12%',
    left: '12%',
    width: '58%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
  },
  darkShine: {backgroundColor: '#2E364E', borderColor: '#3D4760'},
  lightShine: {backgroundColor: '#FFFFFF', borderColor: '#E0D8CC'},

  // Crown text
  crown: {fontSize: 13, lineHeight: 15, fontWeight: '700', marginTop: 2},
  darkCrown: {color: '#C9A84C'},
  lightCrown: {color: '#7A5A18'},

  // Selection glow ring (rendered in pieces layer, position: absolute)
  selectionRing: {position: 'absolute', borderWidth: 2.5, borderColor: '#D4A843'},

  // Actions
  actions: {width: '100%', gap: 10, alignItems: 'stretch'},
});
