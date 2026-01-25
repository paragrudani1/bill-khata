/**
 * BillKhata Feature Gate
 * Declarative component for gating features based on license status
 */

import React, { useState } from 'react';
import { useLicense } from '../../hooks/useLicense';
import { UpgradePrompt } from './UpgradePrompt';

type FeatureType = 'createBill' | 'editBill' | 'editSettings';

interface FeatureGateProps {
  /**
   * The type of feature being gated
   */
  feature: FeatureType;

  /**
   * Children to render - receives a callback to trigger the action
   */
  children: (props: {
    onPress: () => void;
    isAllowed: boolean;
  }) => React.ReactNode;

  /**
   * Callback when the action is allowed and triggered
   */
  onAction: () => void;

  /**
   * Optional custom title for the upgrade prompt
   */
  upgradeTitle?: string;

  /**
   * Optional custom message for the upgrade prompt
   */
  upgradeMessage?: string;
}

/**
 * Feature Gate Component
 *
 * Usage:
 * ```tsx
 * <FeatureGate feature="createBill" onAction={() => router.push('/bill/create')}>
 *   {({ onPress, isAllowed }) => (
 *     <Button title="Create Bill" onPress={onPress} />
 *   )}
 * </FeatureGate>
 * ```
 */
export function FeatureGate({
  feature,
  children,
  onAction,
  upgradeTitle,
  upgradeMessage,
}: FeatureGateProps) {
  const license = useLicense();
  const [showPrompt, setShowPrompt] = useState(false);

  const isAllowed =
    feature === 'createBill'
      ? license.canCreateBill
      : feature === 'editBill'
      ? license.canEditBill
      : license.canEditSettings;

  const handlePress = () => {
    if (isAllowed) {
      onAction();
    } else {
      setShowPrompt(true);
    }
  };

  return (
    <>
      {children({ onPress: handlePress, isAllowed })}

      <UpgradePrompt
        visible={showPrompt}
        onClose={() => setShowPrompt(false)}
        title={upgradeTitle}
        message={upgradeMessage}
      />
    </>
  );
}

/**
 * Higher-order component version of FeatureGate
 */
export function withFeatureGate<P extends { onPress?: () => void }>(
  WrappedComponent: React.ComponentType<P>,
  feature: FeatureType
) {
  return function WithFeatureGate(props: Omit<P, 'onPress'> & { onAction: () => void }) {
    const { onAction, ...rest } = props;

    return (
      <FeatureGate feature={feature} onAction={onAction}>
        {({ onPress }) => <WrappedComponent {...(rest as unknown as P)} onPress={onPress} />}
      </FeatureGate>
    );
  };
}
