import { TextInput, TextInputProps, View, Text } from 'react-native';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    containerClassName?: string;
}

export function Input({
    label,
    error,
    className,
    containerClassName,
    ...props
}: InputProps) {
    return (
        <View className={twMerge("w-full space-y-2", containerClassName)}>
            {label && (
                <Text className="text-sm font-medium text-slate-700 dark:text-slate-300 ml-1">
                    {label}
                </Text>
            )}
            <TextInput
                className={twMerge(
                    "w-full px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-500 text-slate-900 dark:text-white",
                    error ? "border-red-500" : "",
                    className
                )}
                placeholderTextColor="#94a3b8"
                {...props}
            />
            {error && (
                <Text className="text-xs text-red-500 ml-1">
                    {error}
                </Text>
            )}
        </View>
    );
}
