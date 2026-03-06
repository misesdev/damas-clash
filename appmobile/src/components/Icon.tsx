import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'

type Props = {
  name: React.ComponentProps<typeof Ionicons>['name']
  size?: number
  color?: string
}

export function Icon({ name, size = 24, color = '#fff' }: Props) {
  return <Ionicons name={name} size={size} color={color} />
}
