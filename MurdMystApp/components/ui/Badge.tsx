import React from 'react'
import { View, Text } from 'react-native'
import type { ViewProps } from 'react-native'

interface BadgeProps extends ViewProps {
    children: React.ReactNode
    variant?: 'default' | 'success' | 'warning' | 'danger' | 'purple'
    size?: 'sm' | 'md'
}

export function Badge({
    children,
    variant = 'default',
    size = 'md',
    className = '',
    ...props
}: BadgeProps) {
    const baseClasses = 'rounded px-2 py-1 items-center justify-center'

    const variantClasses = {
        default: 'bg-slate-800',
        success: 'bg-green-900/30 border border-green-800/50',
        warning: 'bg-orange-900/30 border border-orange-800/50',
        danger: 'bg-red-900/30 border border-red-800/50',
        purple: 'bg-purple-900/30 border border-purple-800/50'
    }

    const textVariantClasses = {
        default: 'text-slate-400',
        success: 'text-green-400',
        warning: 'text-orange-400',
        danger: 'text-red-400',
        purple: 'text-purple-400'
    }

    const sizeClasses = {
        sm: 'text-[10px]',
        md: 'text-xs'
    }

    return (
        <View
            className={`${baseClasses} ${variantClasses[variant]} ${className}`}
            {...props}
        >
            <Text className={`${textVariantClasses[variant]} ${sizeClasses[size]} font-medium`}>
                {children}
            </Text>
        </View>
    )
}
