import React from 'react'
import { View } from 'react-native'
import type { ViewProps } from 'react-native'

interface CardProps extends ViewProps {
    children: React.ReactNode
    variant?: 'default' | 'bordered' | 'gradient'
}

export function Card({ children, variant = 'default', className = '', ...props }: CardProps) {
    const baseClasses = 'rounded-xl p-6'

    const variantClasses = {
        default: 'bg-slate-900 border border-slate-800',
        bordered: 'bg-slate-950 border-2 border-purple-600',
        gradient: 'bg-gradient-to-r from-purple-900/30 to-slate-900/30 border border-purple-800/50'
    }

    return (
        <View
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            {children}
        </View>
    )
}
