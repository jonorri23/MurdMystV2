import { Text, TouchableOpacity, TouchableOpacityProps, ActivityIndicator, View } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    className?: string;
    icon?: React.ReactNode;
}

export function Button({
    title,
    variant = 'primary',
    size = 'md',
    loading = false,
    className,
    disabled,
    icon,
    ...props
}: ButtonProps) {

    const baseStyles = "flex-row items-center justify-center rounded-xl active:opacity-80";

    const variants = {
        primary: "bg-indigo-600",
        secondary: "bg-slate-800",
        outline: "border-2 border-indigo-600 bg-transparent",
        ghost: "bg-transparent"
    };

    const sizes = {
        sm: "px-4 py-2",
        md: "px-6 py-3",
        lg: "px-8 py-4"
    };

    const textBaseStyles = "font-bold text-center";

    const textVariants = {
        primary: "text-white",
        secondary: "text-white",
        outline: "text-indigo-600",
        ghost: "text-indigo-600"
    };

    const textSizes = {
        sm: "text-sm",
        md: "text-base",
        lg: "text-lg"
    };

    return (
        <TouchableOpacity
            className={twMerge(
                baseStyles,
                variants[variant],
                sizes[size],
                disabled || loading ? "opacity-50" : "",
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={variant === 'outline' || variant === 'ghost' ? '#4f46e5' : 'white'} />
            ) : (
                <View className="flex-row items-center">
                    {icon && <View className="mr-2">{icon}</View>}
                    <Text className={twMerge(textBaseStyles, textVariants[variant], textSizes[size])}>
                        {title}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
}
